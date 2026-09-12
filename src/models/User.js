import prisma from '../database/connection.js';

const User = {
  findByTelegramId(telegramId) {
    return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id: Number(id) } });
  },

  upsert({ telegramId, firstName, lastName, username }) {
    return prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: { firstName, lastName, username },
      create: {
        telegramId: String(telegramId),
        firstName: firstName || 'Mijoz',
        lastName: lastName || null,
        username: username || null,
      },
    });
  },

  updatePhone(id, phone) {
    return prisma.user.update({ where: { id: Number(id) }, data: { phone } });
  },

  updateContact(id, { contactName, phone }) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: { contactName, phone },
    });
  },

  count() {
    return prisma.user.count();
  },
};

export default User;
