const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');
  
  // Clean existing products
  await prisma.product.deleteMany({});
  
  const products = [
    {
      name: 'Canapé Velours Bordeaux Impérial',
      description: 'Canapé haut de gamme en velours bordeaux capitonné, avec structure en bois massif d\'acajou. Offre un confort inégalé et une esthétique raffinée pour vos salons professionnels ou espaces VIP.',
      price: 1200000.00,
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Table de Bureau Royale en Chêne',
      description: 'Table de direction exécutive en bois de chêne massif verni, avec passe-câbles intégrés et tiroirs sécurisés par empreinte ou clé. Parfaite pour les bureaux de gérants exigeants.',
      price: 850000.00,
      image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Table de Conférence GMD (12 Places)',
      description: 'Grande table de réunion modulaire en frêne noir texturé. Dotée de boîtiers de connectique complets (HDMI, USB-C, RJ45) encastrés pour des présentations fluides.',
      price: 2500000.00,
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Fauteuil Directeur Ergonomique Cuir',
      description: 'Fauteuil de bureau haut de gamme en cuir pleine fleur noir. Ergonomie avancée avec accoudoirs 4D, soutien lombaire adaptatif et inclinaison synchrone verrouillable.',
      price: 350000.00,
      image_url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Bibliothèque Acajou Premium',
      description: 'Grande bibliothèque en bois d\'acajou précieux, comportant 5 étagères renforcées pour documents d\'archive et 2 portes vitrées avec serrure de sécurité.',
      price: 750000.00,
      image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Ensemble Lit Royal GMD',
      description: 'Ensemble de chambre haut de gamme incluant un lit King Size en cuir de nubuck, un matelas orthopédique grand confort et deux tables de chevet assorties.',
      price: 1800000.00,
      image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'
    }
  ];

  for (const product of products) {
    const created = await prisma.product.create({
      data: product
    });
    console.log(`Created product: ${created.name}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
