const mongoose = require('mongoose');
const User = require('./userModel');

const Schema = mongoose.Schema;

const NotificationsSchema = new Schema(
  {
    userTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userFrom: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notificationType: {
      type: String,
    },
    opened: {
      type: Boolean,
      default: false,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

NotificationsSchema.statics.insertNotification = async (
  userTo,
  userFrom,
  notificationType,
  entityId
) => {
  const data = {
    userTo: userTo,
    userFrom: userFrom,
    notificationType: notificationType,
    entityId: entityId,
  };

  await Notification.deleteOne(data).catch((error) => {
    console.log(error);
  });
  return Notification.create(data).catch((error) => {
    console.log(error);
  });
};

const Notification = mongoose.model('Notification', NotificationsSchema);
module.exports = Notification;
