const Fund = require('../models/fund.model');

exports.getTotalFund = async (req, res) => {
  try {
    let fund = await Fund.findOne();
    if (!fund) {
      fund = new Fund({ totalFund: 0 });
      await fund.save();
    }
    res.status(200).json({ totalFund: fund.totalFund });
  } catch (error) {
    console.error('Error fetching fund:', error);
    res.status(500).json({ message: 'Failed to fetch fund amount' });
  }
};
