const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const OpenAI = require('openai');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key'
});

// Get AI-powered spending insights
router.get('/insights', protect, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const period = startDate && endDate ? { startDate, endDate } : {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    };

    // Get user's expenses and budgets
    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: period.startDate, $lte: period.endDate }
    });

    const budgets = await Budget.find({
      user: req.user.id,
      active: true
    });

    // Prepare data for analysis
    const categorySpending = await Expense.getExpensesByCategory(
      req.user.id,
      period.startDate,
      period.endDate
    );

    const spendingPatterns = expenses.reduce((acc, expense) => {
      const date = expense.date.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += expense.amount;
      return acc;
    }, {});

    // Prepare context for AI analysis
    const context = {
      totalSpent: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      categoryBreakdown: categorySpending,
      dailySpending: spendingPatterns,
      budgets: budgets.map(budget => ({
        category: budget.category,
        amount: budget.amount,
        spent: categorySpending.find(cat => cat._id === budget.category)?.total || 0
      }))
    };

    // Generate AI insights
    const prompt = `
      As a financial advisor, analyze this spending data and provide insights:
      Total Spent: $${context.totalSpent}
      Category Breakdown: ${JSON.stringify(context.categoryBreakdown)}
      Budget Information: ${JSON.stringify(context.budgets)}

      Please provide:
      1. Key spending patterns and trends
      2. Areas of concern or overspending
      3. Specific recommendations for improvement
      4. Potential savings opportunities
      5. Budget adjustment suggestions
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 500
    });

    const insights = completion.choices[0].message.content;

    // Generate specific recommendations
    const recommendationPrompt = `
      Based on this spending analysis:
      ${JSON.stringify(context)}

      Provide 3-5 specific, actionable recommendations to help the user save money.
      Focus on the categories with the highest spending relative to their budgets.
    `;

    const recommendationCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: recommendationPrompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 300
    });

    const recommendations = recommendationCompletion.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        insights,
        recommendations,
        analysis: {
          totalSpent: context.totalSpent,
          categoryBreakdown: context.categoryBreakdown,
          budgetComparison: context.budgets
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get AI-powered budget recommendations
router.get('/budget-recommendations', protect, async (req, res, next) => {
  try {
    // Get user's income (you would need to add this to your user model)
    const user = await User.findById(req.user.id);
    const monthlyIncome = user.monthlyIncome || 0;

    // Get historical spending data
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: threeMonthsAgo }
    });

    const categorySpending = await Expense.getExpensesByCategory(
      req.user.id,
      threeMonthsAgo,
      new Date()
    );

    // Prepare context for AI recommendations
    const context = {
      monthlyIncome,
      averageMonthlySpending: expenses.reduce((sum, exp) => sum + exp.amount, 0) / 3,
      categoryBreakdown: categorySpending
    };

    const prompt = `
      As a financial advisor, recommend monthly budgets based on this data:
      Monthly Income: $${context.monthlyIncome}
      Average Monthly Spending: $${context.averageMonthlySpending}
      Category Breakdown: ${JSON.stringify(context.categoryBreakdown)}

      Please provide:
      1. Recommended budget allocation for each spending category
      2. Explanation for each recommendation
      3. Suggested savings goals
      4. Areas where spending could be optimized
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 500
    });

    const recommendations = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        context: {
          monthlyIncome: context.monthlyIncome,
          averageMonthlySpending: context.averageMonthlySpending,
          categoryBreakdown: context.categoryBreakdown
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get AI-powered savings goals
router.post('/savings-plan', protect, async (req, res, next) => {
  try {
    const { targetAmount, targetDate, purpose } = req.body;

    // Get current financial status
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = await Expense.getTotalExpenses(
      req.user.id,
      new Date(currentYear, currentMonth, 1),
      new Date(currentYear, currentMonth + 1, 0)
    );

    const context = {
      targetAmount,
      targetDate,
      purpose,
      monthlyExpenses,
      monthlyIncome: req.user.monthlyIncome || 0
    };

    const prompt = `
      As a financial advisor, create a savings plan with this goal:
      Target Amount: $${targetAmount}
      Target Date: ${targetDate}
      Purpose: ${purpose}
      Monthly Income: $${context.monthlyIncome}
      Monthly Expenses: $${monthlyExpenses}

      Please provide:
      1. Monthly savings target needed to reach the goal
      2. Specific strategies to achieve the savings goal
      3. Potential obstacles and how to overcome them
      4. Alternative approaches if the primary plan isn't feasible
      5. Milestones to track progress
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 500
    });

    const savingsPlan = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        savingsPlan,
        context
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
