import prisma from '../database/connection.js';

const Product = {
  findAll({ category, onlyActive = true } = {}) {
    const where = {};
    if (onlyActive) where.isActive = true;
    if (category && category !== 'all') where.category = category;
    return prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
  },

  findById(id) {
    return prisma.product.findUnique({ where: { id: Number(id) } });
  },

  findRecommended() {
    return prisma.product.findMany({
      where: { isRecommended: true, isActive: true },
      orderBy: { price: 'asc' },
    });
  },

  async categories() {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  },

  create(data) {
    return prisma.product.create({ data });
  },

  update(id, data) {
    return prisma.product.update({ where: { id: Number(id) }, data });
  },

  remove(id) {
    return prisma.product.delete({ where: { id: Number(id) } });
  },

  count() {
    return prisma.product.count();
  },
};

export default Product;
