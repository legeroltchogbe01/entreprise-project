const prisma = require('./prisma');

/**
 * Checks a specific company and deactivates it if it has been approved for more than 48 hours
 * and has completed zero orders.
 * @param {string} companyId 
 * @returns {Promise<object|null>} The updated or original company object.
 */
async function checkAndDeactivateCompany(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { orders: true, wallet: true }
    });

    if (company && company.kyc_status === 'APPROVED' && company.activated_at) {
      // If wallet is already activated, do not deactivate
      if (company.wallet && company.wallet.activated_at) {
        return company;
      }
      const elapsedHours = (Date.now() - new Date(company.activated_at).getTime()) / (1000 * 60 * 60);
      if (elapsedHours >= 48 && company.orders.length === 0) {
        console.log(`[AutoDeactivate] Deactivating company "${company.denomination_sociale}" (${company.id}) - 48h limit exceeded without purchases.`);
        const updated = await prisma.company.update({
          where: { id: companyId },
          data: { kyc_status: 'DEACTIVATED' },
          include: { wallet: true, orders: true }
        });
        return updated;
      }
    }
    return company;
  } catch (error) {
    console.error(`[AutoDeactivate] Error in checkAndDeactivateCompany for ${companyId}:`, error);
    return null;
  }
}

/**
 * Iterates through all APPROVED companies and auto-deactivates those that violate the 48-hour limit.
 */
async function checkAndDeactivateAllCompanies() {
  try {
    const approvedCompanies = await prisma.company.findMany({
      where: { kyc_status: 'APPROVED' },
      include: { orders: true, wallet: true }
    });

    const now = Date.now();
    for (const company of approvedCompanies) {
      // If wallet is already activated, skip deactivation
      if (company.wallet && company.wallet.activated_at) {
        continue;
      }
      if (company.activated_at) {
        const elapsedHours = (now - new Date(company.activated_at).getTime()) / (1000 * 60 * 60);
        if (elapsedHours >= 48 && company.orders.length === 0) {
          console.log(`[AutoDeactivate] Batch deactivating company "${company.denomination_sociale}" (${company.id}) - 48h limit exceeded.`);
          await prisma.company.update({
            where: { id: company.id },
            data: { kyc_status: 'DEACTIVATED' }
          });
        }
      }
    }
  } catch (error) {
    console.error('[AutoDeactivate] Error in checkAndDeactivateAllCompanies:', error);
  }
}

module.exports = {
  checkAndDeactivateCompany,
  checkAndDeactivateAllCompanies
};
