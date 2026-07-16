const prisma = require('./prisma');
const { sendDebtReminderEmail } = require('./emailService');

/**
 * Daily job that sends email reminders based on:
 * - J-10, J-1, J: Texte C001
 * - J+1, J+5: Texte C002 (with penalties details)
 * - J+6 and every 5 days after: Texte C003 (with solde, penalty, total due details)
 */
async function runPaymentReminderJob() {
  console.log('[REMINDER JOB] Starting daily payment reminder check and penalty calculation...');
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'APPROVED' },
      include: {
        company: {
          select: {
            denomination_sociale: true,
            email: true,
            manager_email: true,
            manager_name: true
          }
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sent = 0;

    for (const order of orders) {
      const schedule = JSON.parse(JSON.stringify(order.payment_schedule || []));
      let orderModified = false;

      for (const installment of schedule) {
        if (installment.paid) continue;

        const dueDate = new Date(installment.due_date);
        dueDate.setHours(0, 0, 0, 0);
        // diffDays is positive in the future, negative in the past
        const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

        const co = order.company;
        const emailTo = [co.email, co.manager_email].filter(Boolean).join(', ');

        // Apply 5% penalty per day late (only if diffDays < 0)
        let daysLate = 0;
        if (diffDays < 0) {
          daysLate = Math.abs(diffDays);
          
          if (!installment.original_amount) {
            installment.original_amount = parseFloat(installment.amount);
          }
          
          const original = parseFloat(installment.original_amount);
          const penalty = original * 0.05 * daysLate;
          
          installment.penalty_amount = penalty;
          installment.amount = original + penalty;
          orderModified = true;
          
          console.log(`[PENALTY] Commande ${order.order_number} - Échéance N°${installment.installment_number} : ${daysLate} jour(s) de retard (+${penalty} FCFA). Nouveau total: ${installment.amount} FCFA.`);
        }

        // Send reminders
        if (emailTo) {
          let emailType = null;
          let penaltyAmount = installment.penalty_amount || 0;
          let soldeDu = installment.original_amount || installment.amount;
          let totalDue = installment.amount;

          if (diffDays === 10 || diffDays === 1 || diffDays === 0) {
            // Relance 1, 2, 3 -> C001
            emailType = 'C001';
          } else if (diffDays === -1 || diffDays === -5) {
            // Relance 4, 5 -> C002
            emailType = 'C002';
          } else if (diffDays <= -6) {
            // Relance 6 -> C003 (every 5 days: J+6, J+11, J+16...)
            if ((daysLate - 6) % 5 === 0) {
              emailType = 'C003';
            }
          }

          if (emailType) {
            await sendDebtReminderEmail({
              to: emailTo,
              managerName: co.manager_name || 'Gérant',
              amount: installment.original_amount || installment.amount,
              dueDate: installment.due_date,
              type: emailType,
              penaltyAmount,
              totalDue,
              soldeDu
            }).catch(err => console.error(`[REMINDER] Erreur d'envoi email (${emailType}):`, err.message));
            sent++;
          }
        }
      }

      // Save updated schedule with calculated penalty back to database
      if (orderModified) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            payment_schedule: schedule
          }
        });
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
