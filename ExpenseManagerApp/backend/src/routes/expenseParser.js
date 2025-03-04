const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Parse expense from text using AI
router.post('/parse-expense', protect, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Please provide text to parse'
      });
    }

    // Prepare the prompt for expense parsing
    const prompt = `
      Parse the following text into an expense entry. Extract the amount, category, and description.
      Categories should be one of: Food, Transportation, Housing, Utilities, Entertainment, Shopping, Healthcare, Education, Travel, Bills, Others.
      If a category isn't explicitly mentioned, infer it from the context.
      Format the response as JSON with amount (number), category (string), and description (string).

      Text to parse: "${text}"

      Example response format:
      {
        "amount": 25.50,
        "category": "Food",
        "description": "Lunch at Restaurant"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.3, // Lower temperature for more consistent parsing
      response_format: { type: "json_object" }
    });

    let parsedExpense;
    try {
      parsedExpense = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }

    // Validate the parsed expense
    if (!parsedExpense.amount || !parsedExpense.category || !parsedExpense.description) {
      throw new Error('Invalid expense format from AI');
    }

    // Ensure amount is a number
    const amount = Number(parsedExpense.amount);
    if (isNaN(amount)) {
      throw new Error('Invalid amount parsed from text');
    }

    // Validate category
    const validCategories = [
      'Food', 'Transportation', 'Housing', 'Utilities', 
      'Entertainment', 'Shopping', 'Healthcare', 'Education', 
      'Travel', 'Bills', 'Others'
    ];
    
    if (!validCategories.includes(parsedExpense.category)) {
      parsedExpense.category = 'Others';
    }

    res.status(200).json({
      success: true,
      data: {
        amount,
        category: parsedExpense.category,
        description: parsedExpense.description
      }
    });

  } catch (err) {
    console.error('Error parsing expense:', err);
    next(err);
  }
});

module.exports = router;
