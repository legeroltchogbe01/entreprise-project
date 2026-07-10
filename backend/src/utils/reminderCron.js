const { PrismaClient } = require('@prisma/client');
const { sendPaymentReminderEmail } = require('./emailService');
const prisma = new PrismaClient();

/**
 * Daily job that sends email reminders for:
 * - J-3: Upcoming installments due in 3 days
 * - J+1: Overdue installments (1 day late)
 * - J+7: Severely late installments (7 days late)
 */
async function runPaymentReminderJob() {
  console.log('[REMINDER JOB] Starting daily payment reminder check...');
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'APPROVED' },
      include: {
        company: {
          select: {
            denomination_sociale: true,
            email: true,
            manager_email: true
          }
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sent = 0;

    for (const order of orders) {
      const schedule = order.payment_schedule || [];
      for (const installment of schedule) {
        if (installment.paid) continue;

        const dueDate = new Date(installment.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

        const co = order.company;
        const emailTo = [co.email, co.manager_email].filter(Boolean).join(', ');
        if (!emailTo) continue;

        const dueDateLabel = dueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

        if (diffDays === 3) {
          // J-3 : upcoming reminder
          await sendPaymentReminderEmail({
            to: emailTo,
            denominationSociale: co.denomination_sociale,
            amount: installment.amount,
            dueDate: dueDateLabel,
            isOverdue: false
          }).catch(err => console.error('[REMINDER] Erreur J-3:', err.message));
          sent++;
        } else if (diffDays === -1 || diffDays === -7) {
          // J+1 or J+7 : overdue reminder
          await sendPaymentReminderEmail({
            to: emailTo,
            denominationSociale: co.denomination_sociale,
            amount: installment.amount,
            dueDate: dueDateLabel,
            isOverdue: true
          }).catch(err => console.error('[REMINDER] Erreur J+:', err.message));
          sent++;
        }
      }
    }

    console.log(`[REMINDER JOB] Done. ${sent} email(s) sent.`);
  } catch (err) {
    console.error('[REMINDER JOB] Error:', err.message);
  }
}

/**
 * Schedule the job to run every day at 08:00 AM server time.
 */
function startReminderCron() {
  const now = new Date();
  const firstRun = new Date(now);
  firstRun.setHours(8, 0, 0, 0);
  if (firstRun <= now) {
    firstRun.setDate(firstRun.getDate() + 1);
  }
  const msUntilFirst = firstRun - now;

  console.log(`[REMINDER JOB] Scheduled. First run in ${Math.round(msUntilFirst / 60000)} minutes.`);

  setTimeout(() => {
    runPaymentReminderJob();
    // Then repeat every 24h
    setInterval(runPaymentReminderJob, 24 * 60 * 60 * 1000);
  }, msUntilFirst);
}

module.exports = { startReminderCron, runPaymentReminderJob };
