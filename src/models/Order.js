import prisma from '../database/connection.js';

const Order = {
  create(data) {
    return prisma.order.create({ data });
  },

  findAll({ status } = {}) {
    const where = {};
    if (status && status !== 'all') where.status = status;
    return prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByUserId(userId) {
    return prisma.order.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id) {
    return prisma.order.findUnique({
      where: { id: Number(id) },
      include: { user: true },
    });
  },

  updateStatus(id, status) {
    return prisma.order.update({ where: { id: Number(id) }, data: { status } });
  },

  count() {
    return prisma.order.count();
  },

  async totalRevenue() {
    const result = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { status: { not: 'canceled' } },
    });
    return result._sum.totalPrice || 0;
  },
};

export default Order;
