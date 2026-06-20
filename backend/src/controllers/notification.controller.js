'use strict';

const Notification = require('../models/Notification.model');
const { sendSuccess, sendNotFound, sendError } = require('../utils/apiResponse');

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const query = { userId: req.user._id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Notification.countDocuments(query),
    ]);

    return sendSuccess(res, {
      data: {
        notifications,
        meta: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      message: 'Notifications retrieved successfully',
    });
  } catch (err) {
    return sendError(res, { message: 'Failed to retrieve notifications' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return sendNotFound(res, 'Notification not found');
    }

    return sendSuccess(res, {
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (err) {
    return sendError(res, { message: 'Failed to mark notification as read' });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res, {
      message: 'All notifications marked as read',
    });
  } catch (err) {
    return sendError(res, { message: 'Failed to mark all notifications as read' });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
