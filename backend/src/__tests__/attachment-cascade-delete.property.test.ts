import * as fc from "fast-check";

/**
 * Property 4: Attachment Deletion Cascade
 * 验证交易删除时附件级联删除的正确性
 */

// 模拟附件
interface MockAttachment {
  id: number;
  transactionId: number | null;
  storagePath: string;
}

// 模拟交易
interface MockTransaction {
  id: number;
  userId: number;
}

// 模拟存储
class MockCascadeStore {
  private attachments: Map<number, MockAttachment> = new Map();
  private transactions: Map<number, MockTransaction> = new Map();
  private deletedFiles: Set<string> = new Set();
  private nextAttachmentId = 1;
  private nextTransactionId = 1;

  createTransaction(userId: number): MockTransaction {
    const transaction: MockTransaction = {
      id: this.nextTransactionId++,
      userId,
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  createAttachment(transactionId: number | null): MockAttachment {
    const attachment: MockAttachment = {
      id: this.nextAttachmentId++,
      transactionId,
      storagePath: `uploads/${Date.now()}_${Math.random()}.jpg`,
    };
    this.attachments.set(attachment.id, attachment);
    return attachment;
  }

  linkAttachment(attachmentId: number, transactionId: number): void {
    const attachment = this.attachments.get(attachmentId);
    if (attachment) {
      attachment.transactionId = transactionId;
    }
  }

  deleteTransaction(transactionId: number): {
    deletedAttachments: number[];
    deletedFiles: string[];
  } {
    const deletedAttachments: number[] = [];
    const deletedFiles: string[] = [];

    // 找到所有关联的附件
    for (const [id, attachment] of this.attachments) {
      if (attachment.transactionId === transactionId) {
        deletedAttachments.push(id);
        deletedFiles.push(attachment.storagePath);
        this.deletedFiles.add(attachment.storagePath);
        this.attachments.delete(id);
      }
    }

    // 删除交易
    this.transactions.delete(transactionId);

    return { deletedAttachments, deletedFiles };
  }

  getAttachmentsByTransaction(transactionId: number): MockAttachment[] {
    return Array.from(this.attachments.values()).filter(
      (a) => a.transactionId === transactionId
    );
  }

  getAttachment(id: number): MockAttachment | undefined {
    return this.attachments.get(id);
  }

  getTransaction(id: number): MockTransaction | undefined {
    return this.transactions.get(id);
  }

  isFileDeleted(path: string): boolean {
    return this.deletedFiles.has(path);
  }

  clear(): void {
    this.attachments.clear();
    this.transactions.clear();
    this.deletedFiles.clear();
    this.nextAttachmentId = 1;
    this.nextTransactionId = 1;
  }
}

describe("Property 4: Attachment Deletion Cascade", () => {
  let store: MockCascadeStore;

  beforeEach(() => {
    store = new MockCascadeStore();
  });

  test("删除交易时，所有关联的附件记录应被删除", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 5 }), // attachmentCount
        (userId, attachmentCount) => {
          store.clear();

          // 创建交易和附件
          const transaction = store.createTransaction(userId);
          const attachments: MockAttachment[] = [];

          for (let i = 0; i < attachmentCount; i++) {
            const attachment = store.createAttachment(null);
            store.linkAttachment(attachment.id, transaction.id);
            attachments.push(attachment);
          }

          // 验证附件已关联
          expect(store.getAttachmentsByTransaction(transaction.id).length).toBe(
            attachmentCount
          );

          // 删除交易
          const result = store.deleteTransaction(transaction.id);

          // 验证所有附件记录已删除
          expect(result.deletedAttachments.length).toBe(attachmentCount);
          for (const attachment of attachments) {
            expect(store.getAttachment(attachment.id)).toBeUndefined();
          }

          // 验证交易已删除
          expect(store.getTransaction(transaction.id)).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test("删除交易时，所有关联的文件应被删除", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 5 }), // attachmentCount
        (userId, attachmentCount) => {
          store.clear();

          // 创建交易和附件
          const transaction = store.createTransaction(userId);
          const storagePaths: string[] = [];

          for (let i = 0; i < attachmentCount; i++) {
            const attachment = store.createAttachment(null);
            store.linkAttachment(attachment.id, transaction.id);
            storagePaths.push(attachment.storagePath);
          }

          // 删除交易
          const result = store.deleteTransaction(transaction.id);

          // 验证所有文件已删除
          expect(result.deletedFiles.length).toBe(attachmentCount);
          for (const path of storagePaths) {
            expect(store.isFileDeleted(path)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test("删除交易不影响其他交易的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 3 }), // attachmentCount1
        fc.integer({ min: 1, max: 3 }), // attachmentCount2
        (userId, attachmentCount1, attachmentCount2) => {
          store.clear();

          // 创建两个交易
          const transaction1 = store.createTransaction(userId);
          const transaction2 = store.createTransaction(userId);

          // 为两个交易创建附件
          for (let i = 0; i < attachmentCount1; i++) {
            const attachment = store.createAttachment(null);
            store.linkAttachment(attachment.id, transaction1.id);
          }

          const transaction2Attachments: MockAttachment[] = [];
          for (let i = 0; i < attachmentCount2; i++) {
            const attachment = store.createAttachment(null);
            store.linkAttachment(attachment.id, transaction2.id);
            transaction2Attachments.push(attachment);
          }

          // 删除第一个交易
          store.deleteTransaction(transaction1.id);

          // 验证第二个交易的附件不受影响
          expect(
            store.getAttachmentsByTransaction(transaction2.id).length
          ).toBe(attachmentCount2);
          for (const attachment of transaction2Attachments) {
            expect(store.getAttachment(attachment.id)).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test("删除没有附件的交易应该正常工作", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (userId) => {
        store.clear();

        // 创建没有附件的交易
        const transaction = store.createTransaction(userId);

        // 删除交易
        const result = store.deleteTransaction(transaction.id);

        // 验证结果
        expect(result.deletedAttachments.length).toBe(0);
        expect(result.deletedFiles.length).toBe(0);
        expect(store.getTransaction(transaction.id)).toBeUndefined();
      }),
      { numRuns: 50 }
    );
  });

  test("未关联交易的附件不受影响", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 3 }), // linkedCount
        fc.integer({ min: 1, max: 3 }), // unlinkedCount
        (userId, linkedCount, unlinkedCount) => {
          store.clear();

          // 创建交易
          const transaction = store.createTransaction(userId);

          // 创建关联的附件
          for (let i = 0; i < linkedCount; i++) {
            const attachment = store.createAttachment(null);
            store.linkAttachment(attachment.id, transaction.id);
          }

          // 创建未关联的附件
          const unlinkedAttachments: MockAttachment[] = [];
          for (let i = 0; i < unlinkedCount; i++) {
            const attachment = store.createAttachment(null);
            unlinkedAttachments.push(attachment);
          }

          // 删除交易
          store.deleteTransaction(transaction.id);

          // 验证未关联的附件不受影响
          for (const attachment of unlinkedAttachments) {
            expect(store.getAttachment(attachment.id)).toBeDefined();
            expect(store.isFileDeleted(attachment.storagePath)).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
