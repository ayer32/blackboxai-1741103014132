const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [100, 'Description cannot be more than 100 characters']
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
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: [
      'Cash',
      'Credit Card',
      'Debit Card',
      'Bank Transfer',
      'Mobile Payment',
      'Others'
    ],
    default: 'Cash'
  },
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  receipt: {
    url: String,
    publicId: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
    },
    endDate: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ category: 1 });

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for month and year
expenseSchema.virtual('monthYear').get(function() {
  return `${this.date.getMonth() + 1}-${this.date.getFullYear()}`;
});

// Static method to get total expenses for a user in a date range
expenseSchema.statics.getTotalExpenses = async function(userId, startDate, endDate) {
  const total = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
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

  return total.length > 0 ? total[0].total : 0;
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = async function(userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Middleware to check if expense amount exceeds budget
expenseSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const Budget = mongoose.model('Budget');
    const budget = await Budget.findOne({
      user: this.user,
      category: this.category,
      active: true
    });

    if (budget) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);

      const totalExpenses = await this.constructor.getTotalExpenses(
        this.user,
        startDate,
        endDate
      );

      if (totalExpenses + this.amount > budget.amount) {
        // We don't prevent saving, but we could emit an event or notification here
        console.log('Budget exceeded for category:', this.category);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
