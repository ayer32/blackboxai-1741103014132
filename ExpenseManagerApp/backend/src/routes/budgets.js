const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// Get all budgets for the logged-in user
router.get('/', protect, async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    
    // Get status for each budget
    const budgetStatuses = await Promise.all(
      budgets.map(budget => budget.getStatus())
    );

    res.status(200).json({
      success: true,
      count: budgetStatuses.length,
      data: budgetStatuses
    });
  } catch (err) {
    next(err);
  }
});

// Get budget by ID with current status
router.get('/:id', protect, async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    const budgetStatus = await budget.getStatus();

    res.status(200).json({
      success: true,
      data: budgetStatus
    });
  } catch (err) {
    next(err);
  }
});

// Create new budget
router.post('/', protect, async (req, res, next) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    // Check if there's an existing active budget for this category
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category: req.body.category,
      active: true
    });

    if (existingBudget) {
      // Deactivate the existing budget
      existingBudget.active = false;
      await existingBudget.save();
    }

    const budget = await Budget.create(req.body);
    const budgetStatus = await budget.getStatus();

    res.status(201).json({
      success: true,
      data: budgetStatus
    });
  } catch (err) {
    next(err);
  }
});

// Update budget
router.put('/:id', protect, async (req, res, next) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    // If changing category and setting as active, deactivate existing budget in new category
    if (req.body.category && req.body.category !== budget.category && req.body.active) {
      const existingBudget = await Budget.findOne({
        user: req.user.id,
        category: req.body.category,
        active: true,
        _id: { $ne: req.params.id }
      });

      if (existingBudget) {
        existingBudget.active = false;
        await existingBudget.save();
      }
    }

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    const budgetStatus = await budget.getStatus();

    res.status(200).json({
      success: true,
      data: budgetStatus
    });
  } catch (err) {
    next(err);
  }
});

// Delete budget
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    await budget.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

// Get budget overview with spending analysis
router.get('/overview/analysis', protect, async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 1);
    const endDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0);

    // Get all active budgets
    const budgets = await Budget.find({
      user: req.user.id,
      active: true
    });

    // Get total budgeted amount
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    // Get total expenses for the period
    const totalExpenses = await Expense.getTotalExpenses(req.user.id, startDate, endDate);

    // Get category-wise spending
    const categorySpending = await Expense.getExpensesByCategory(req.user.id, startDate, endDate);

    // Calculate budget vs actual for each category
    const budgetAnalysis = budgets.map(budget => {
      const spending = categorySpending.find(cat => cat._id === budget.category);
      return {
        category: budget.category,
        budgeted: budget.amount,
        spent: spending ? spending.total : 0,
        remaining: budget.amount - (spending ? spending.total : 0),
        percentageUsed: spending ? (spending.total / budget.amount) * 100 : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalBudgeted,
        totalExpenses,
        remaining: totalBudgeted - totalExpenses,
        percentageUsed: (totalExpenses / totalBudgeted) * 100,
        categoryAnalysis: budgetAnalysis
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
