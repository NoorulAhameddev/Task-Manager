import type { Mock } from 'vitest';

export interface MockedPrisma {
  user: {
    findUnique: Mock;
    create: Mock;
  };
  task: {
    findMany: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
}

export function resetPrismaMock(prisma: MockedPrisma) {
  Object.values(prisma.user).forEach((fn) => fn.mockReset());
  Object.values(prisma.task).forEach((fn) => fn.mockReset());
}
