import { getStudentDashboard } from '../services/studentDashboardService.js';

export const getStudentDashboardData = async (req, res, next) => {
  try {
    const dashboard = await getStudentDashboard(req.user);
    res.status(200).json({ status: 'success', ...dashboard });
  } catch (error) {
    next(error);
  }
};
