const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');

// Get all expenses for the logged-in user
router.get('/', protect, async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      minAmount, 
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { user: req.user.id };

    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Amount filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: expenses
    });
  } catch (err) {
    next(err);
  }
});

// Get expense by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (err) {
    next(err);
  }
});

// Create new expense
router.post('/', protect, async (req, res, next) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    const expense = await Expense.create(req.body);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (err) {
    next(err);
  }
});

// Update expense
router.put('/:id', protect, async (req, res, next) => {
  try {
    let expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (err) {
    next(err);
  }
});

// Delete expense
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    await expense.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

// Get expense statistics
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Get total expenses
    const total = await Expense.getTotalExpenses(
      req.user.id,
      startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate || new Date()
    );

    // Get expenses by category
    const categoryBreakdown = await Expense.getExpensesByCategory(
      req.user.id,
      startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate || new Date()
    );

    res.status(200).json({
      success: true,
      data: {
        total,
        categoryBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
});

// Bulk create expenses (for importing)
router.post('/bulk', protect, async (req, res, next) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses)) {
      return res.status(400).json({
        success: false,
        error: 'Expenses must be an array'
      });
    }

    // Add user to each expense
    const expensesWithUser = expenses.map(expense => ({
      ...expense,
      user: req.user.id
    }));

    const createdExpenses = await Expense.insertMany(expensesWithUser);

    res.status(201).json({
      success: true,
      count: createdExpenses.length,
      data: createdExpenses
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
