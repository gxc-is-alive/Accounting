import * as fc from "fast-check";

/**
 * Property 3: Transaction-Attachment Association
 * 验证附件与交易的关联关系正确性
 */

// 模拟附件数据
interface MockAttachment {
  id: number;
  transactionId: number | null;
  userId: number;
  filename: string;
}

// 模拟附件存储
class MockAttachmentStore {
  private attachments: Map<number, MockAttachment> = new Map();
  private nextId = 1;

  create(userId: number, filename: string): MockAttachment {
    const attachment: MockAttachment = {
      id: this.nextId++,
      transactionId: null,
      userId,
      filename,
    };
    this.attachments.set(attachment.id, attachment);
    return attachment;
  }

  linkToTransaction(
    attachmentIds: number[],
    transactionId: number,
    userId: number
  ): { success: boolean; error?: string } {
    // 验证所有附件存在且属于用户
    for (const id of attachmentIds) {
      const attachment = this.attachments.get(id);
      if (!attachment) {
        return { success: false, error: "附件不存在" };
      }
      if (attachment.userId !== userId) {
        return { success: false, error: "无权访问附件" };
      }
      // 检查是否已关联到其他交易
      if (
        attachment.transactionId !== null &&
        attachment.transactionId !== transactionId
      ) {
        return { success: false, error: "附件已关联到其他交易" };
      }
    }

    // 执行关联
    for (const id of attachmentIds) {
      const attachment = this.attachments.get(id);
      if (attachment) {
        attachment.transactionId = transactionId;
      }
    }

    return { success: true };
  }

  getByTransactionId(transactionId: number, userId: number): MockAttachment[] {
    return Array.from(this.attachments.values()).filter(
      (a) => a.transactionId === transactionId && a.userId === userId
    );
  }

  getById(id: number): MockAttachment | undefined {
    return this.attachments.get(id);
  }

  clear(): void {
    this.attachments.clear();
    this.nextId = 1;
  }
}

describe("Property 3: Transaction-Attachment Association", () => {
  let store: MockAttachmentStore;

  beforeEach(() => {
    store = new MockAttachmentStore();
  });

  test("关联后的附件应该有正确的 transactionId", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 1000 }), // transactionId
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 1,
          maxLength: 5,
        }), // filenames
        (userId, transactionId, filenames) => {
          store.clear();

          // 创建附件
          const attachments = filenames.map((name) =>
            store.create(userId, name)
          );
          const attachmentIds = attachments.map((a) => a.id);

          // 关联到交易
          const result = store.linkToTransaction(
            attachmentIds,
            transactionId,
            userId
          );
          expect(result.success).toBe(true);

          // 验证所有附件的 transactionId 正确
          for (const id of attachmentIds) {
            const attachment = store.getById(id);
            expect(attachment?.transactionId).toBe(transactionId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("查询交易附件应返回所有关联的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 1000 }), // transactionId
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 1,
          maxLength: 5,
        }), // filenames
        (userId, transactionId, filenames) => {
          store.clear();

          // 创建并关联附件
          const attachments = filenames.map((name) =>
            store.create(userId, name)
          );
          const attachmentIds = attachments.map((a) => a.id);
          store.linkToTransaction(attachmentIds, transactionId, userId);

          // 查询交易的附件
          const result = store.getByTransactionId(transactionId, userId);

          // 验证返回的附件数量和 ID 正确
          expect(result.length).toBe(attachmentIds.length);
          const resultIds = result.map((a) => a.id).sort();
          const expectedIds = attachmentIds.sort();
          expect(resultIds).toEqual(expectedIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("不同用户的附件不应混淆", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // userId1
        fc.integer({ min: 51, max: 100 }), // userId2 (确保不同)
        fc.integer({ min: 1, max: 1000 }), // transactionId
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 1,
          maxLength: 3,
        }), // filenames1
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
          minLength: 1,
          maxLength: 3,
        }), // filenames2
        (userId1, userId2, transactionId, filenames1, filenames2) => {
          store.clear();

          // 用户1创建并关联附件
          const attachments1 = filenames1.map((name) =>
            store.create(userId1, name)
          );
          store.linkToTransaction(
            attachments1.map((a) => a.id),
            transactionId,
            userId1
          );

          // 用户2创建并关联附件（同一个 transactionId）
          const attachments2 = filenames2.map((name) =>
            store.create(userId2, name)
          );
          store.linkToTransaction(
            attachments2.map((a) => a.id),
            transactionId,
            userId2
          );

          // 用户1查询只能看到自己的附件
          const result1 = store.getByTransactionId(transactionId, userId1);
          expect(result1.length).toBe(attachments1.length);
          expect(result1.every((a) => a.userId === userId1)).toBe(true);

          // 用户2查询只能看到自己的附件
          const result2 = store.getByTransactionId(transactionId, userId2);
          expect(result2.length).toBe(attachments2.length);
          expect(result2.every((a) => a.userId === userId2)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("用户不能关联其他用户的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // ownerId
        fc.integer({ min: 51, max: 100 }), // attackerId
        fc.integer({ min: 1, max: 1000 }), // transactionId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (ownerId, attackerId, transactionId, filename) => {
          store.clear();

          // 所有者创建附件
          const attachment = store.create(ownerId, filename);

          // 攻击者尝试关联
          const result = store.linkToTransaction(
            [attachment.id],
            transactionId,
            attackerId
          );

          // 应该失败
          expect(result.success).toBe(false);
          expect(result.error).toBe("无权访问附件");

          // 附件应该保持未关联状态
          expect(store.getById(attachment.id)?.transactionId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("已关联到其他交易的附件不能重新关联", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 500 }), // transactionId1
        fc.integer({ min: 501, max: 1000 }), // transactionId2 (确保不同)
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (userId, transactionId1, transactionId2, filename) => {
          store.clear();

          // 创建并关联到第一个交易
          const attachment = store.create(userId, filename);
          store.linkToTransaction([attachment.id], transactionId1, userId);

          // 尝试关联到第二个交易
          const result = store.linkToTransaction(
            [attachment.id],
            transactionId2,
            userId
          );

          // 应该失败
          expect(result.success).toBe(false);
          expect(result.error).toBe("附件已关联到其他交易");

          // 附件应该保持原来的关联
          expect(store.getById(attachment.id)?.transactionId).toBe(
            transactionId1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("重复关联到同一交易应该成功", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1, max: 1000 }), // transactionId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (userId, transactionId, filename) => {
          store.clear();

          // 创建并关联
          const attachment = store.create(userId, filename);
          store.linkToTransaction([attachment.id], transactionId, userId);

          // 再次关联到同一交易
          const result = store.linkToTransaction(
            [attachment.id],
            transactionId,
            userId
          );

          // 应该成功（幂等操作）
          expect(result.success).toBe(true);
          expect(store.getById(attachment.id)?.transactionId).toBe(
            transactionId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
