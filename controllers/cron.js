/**
 * CRON Controller
 *
 * Cron jobs are run on a schedule, such as sending notifications to users
 */
const cron = require("node-cron");

/**
 * Slack API
 */
const {
  slack,
  sendNotifications,
  storeLocationInCheckInsCollection,
} = require("./slack");

/**
 * Firestore
 */
const { getLeaveRequestsByUser } = require("./firestore");

const timezones = require("../data/timezones");

const notificationTime = parseInt(process.env.DEBUG_CRON)
  ? "*/1 * * * *"
  : "35 8 * * 1-5";

/**
 * Cron job to send notifications to users
 */
const runCron = async () => {
  const slackUsersList = await slack.users.list();

  const tasks = Promise.all(
    timezones.map(async (location) => {
      console.log("Running CRON job for " + location.name);

      let members = slackUsersList.members.filter(
        (m) => !m.is_bot && !m.deleted && m.tz === location.tz
      );

      const publicHolidays = await location.publicHolidays;

      return cron.schedule(
        notificationTime,
        () => {
          // If current date is a public holiday, don't send notifications
          if (publicHolidays.includes(new Date().toISOString().split("T")[0])) {
            return false;
          }

          // Send notifications to filtered members
          sendNotifications(members);
        },
        {
          scheduled: false,
          timezone: location.tz,
        }
      );
    })
  ).then((tasks) => {
    tasks.forEach((task) => task.start());
  });

  // Start the cron jobs
  // tasks.forEach((task) => task.start());
  // Promise.all(tasks).then((task) => task.start());
};

module.exports = runCron;
