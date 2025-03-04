const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      'Food',
      'Transportation',
      'Housing',
      'Utilities',
      'Entertainment',
      'Shopping',
      'Healthcare',
      'Education',
      'Travel',
      'Bills',
      'Others'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Please provide a budget amount'],
    min: [0, 'Budget amount cannot be negative']
  },
  period: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: function() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    }
  },
  endDate: {
    type: Date,
    default: function() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  rollover: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: [{
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      notified: {
        type: Boolean,
        default: false
      }
    }]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot be more than 200 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
budgetSchema.index({ user: 1, category: 1, active: 1 });
budgetSchema.index({ startDate: 1, endDate: 1 });

// Virtual for current spending
budgetSchema.virtual('currentSpending').get(async function() {
  const Expense = mongoose.model('Expense');
  const spending = await Expense.aggregate([
    {
      $match: {
        user: this.user,
        category: this.category,
        date: {
          $gte: this.startDate,
          $lte: this.endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return spending.length > 0 ? spending[0].total : 0;
});

// Virtual for remaining budget
budgetSchema.virtual('remaining').get(async function() {
  const spending = await this.currentSpending;
  return this.amount - spending;
});

// Virtual for percentage used
budgetSchema.virtual('percentageUsed').get(async function() {
  const spending = await this.currentSpending;
  return (spending / this.amount) * 100;
});

// Method to check if budget is exceeded
budgetSchema.methods.isExceeded = async function() {
  const spending = await this.currentSpending;
  return spending > this.amount;
};

// Method to get budget status with all calculations
budgetSchema.methods.getStatus = async function() {
  const spending = await this.currentSpending;
  const remaining = this.amount - spending;
  const percentageUsed = (spending / this.amount) * 100;

  return {
    budgeted: this.amount,
    spent: spending,
    remaining: remaining,
    percentageUsed: percentageUsed,
    isExceeded: spending > this.amount,
    category: this.category,
    period: this.period,
    startDate: this.startDate,
    endDate: this.endDate
  };
};

// Static method to get all active budgets for a user with their status
budgetSchema.statics.getUserBudgets = async function(userId) {
  const budgets = await this.find({ user: userId, active: true });
  const budgetStatuses = await Promise.all(
    budgets.map(budget => budget.getStatus())
  );
  return budgetStatuses;
};

// Middleware to ensure only one active budget per category per user
budgetSchema.pre('save', async function(next) {
  if (!this.isNew || !this.active) {
    return next();
  }

  const existingBudget = await this.constructor.findOne({
    user: this.user,
    category: this.category,
    active: true,
    _id: { $ne: this._id }
  });

  if (existingBudget) {
    existingBudget.active = false;
    await existingBudget.save();
  }

  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
