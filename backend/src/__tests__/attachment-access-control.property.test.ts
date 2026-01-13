import * as fc from "fast-check";

/**
 * Property 6: Access Control
 * 验证附件访问控制的正确性
 */

// 模拟附件数据
interface MockAttachment {
  id: number;
  userId: number;
  transactionId: number | null;
  filename: string;
}

// 模拟附件存储和访问控制
class MockAttachmentAccessControl {
  private attachments: Map<number, MockAttachment> = new Map();
  private nextId = 1;

  create(userId: number, filename: string): MockAttachment {
    const attachment: MockAttachment = {
      id: this.nextId++,
      userId,
      transactionId: null,
      filename,
    };
    this.attachments.set(attachment.id, attachment);
    return attachment;
  }

  // 检查用户是否有权访问附件
  canAccess(attachmentId: number, userId: number): boolean {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment) return false;
    return attachment.userId === userId;
  }

  // 获取附件（带权限检查）
  getById(attachmentId: number, userId: number): MockAttachment | null {
    if (!this.canAccess(attachmentId, userId)) {
      return null;
    }
    return this.attachments.get(attachmentId) || null;
  }

  // 删除附件（带权限检查）
  delete(
    attachmentId: number,
    userId: number
  ): { success: boolean; error?: string } {
    if (!this.canAccess(attachmentId, userId)) {
      return { success: false, error: "附件不存在或无权访问" };
    }
    this.attachments.delete(attachmentId);
    return { success: true };
  }

  // 获取访问 URL（带权限检查）
  getAccessUrl(
    attachmentId: number,
    userId: number
  ): { url: string | null; error?: string } {
    if (!this.canAccess(attachmentId, userId)) {
      return { url: null, error: "附件不存在或无权访问" };
    }
    const attachment = this.attachments.get(attachmentId);
    return { url: `/uploads/${attachment?.filename}` };
  }

  clear(): void {
    this.attachments.clear();
    this.nextId = 1;
  }
}

describe("Property 6: Access Control", () => {
  let accessControl: MockAttachmentAccessControl;

  beforeEach(() => {
    accessControl = new MockAttachmentAccessControl();
  });

  test("用户可以访问自己的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (userId, filename) => {
          accessControl.clear();

          const attachment = accessControl.create(userId, filename);

          // 用户应该能访问自己的附件
          expect(accessControl.canAccess(attachment.id, userId)).toBe(true);
          expect(accessControl.getById(attachment.id, userId)).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("用户不能访问其他用户的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // ownerId
        fc.integer({ min: 51, max: 100 }), // attackerId (确保不同)
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (ownerId, attackerId, filename) => {
          accessControl.clear();

          const attachment = accessControl.create(ownerId, filename);

          // 其他用户不应该能访问
          expect(accessControl.canAccess(attachment.id, attackerId)).toBe(
            false
          );
          expect(accessControl.getById(attachment.id, attackerId)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("用户不能删除其他用户的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // ownerId
        fc.integer({ min: 51, max: 100 }), // attackerId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (ownerId, attackerId, filename) => {
          accessControl.clear();

          const attachment = accessControl.create(ownerId, filename);

          // 其他用户删除应该失败
          const result = accessControl.delete(attachment.id, attackerId);
          expect(result.success).toBe(false);
          expect(result.error).toBe("附件不存在或无权访问");

          // 附件应该仍然存在
          expect(accessControl.getById(attachment.id, ownerId)).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("用户不能获取其他用户附件的访问 URL", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // ownerId
        fc.integer({ min: 51, max: 100 }), // attackerId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (ownerId, attackerId, filename) => {
          accessControl.clear();

          const attachment = accessControl.create(ownerId, filename);

          // 其他用户获取 URL 应该失败
          const result = accessControl.getAccessUrl(attachment.id, attackerId);
          expect(result.url).toBeNull();
          expect(result.error).toBe("附件不存在或无权访问");
        }
      ),
      { numRuns: 100 }
    );
  });

  test("用户可以删除自己的附件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (userId, filename) => {
          accessControl.clear();

          const attachment = accessControl.create(userId, filename);

          // 用户应该能删除自己的附件
          const result = accessControl.delete(attachment.id, userId);
          expect(result.success).toBe(true);

          // 删除后应该无法访问
          expect(accessControl.getById(attachment.id, userId)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("用户可以获取自己附件的访问 URL", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.string({ minLength: 1, maxLength: 50 }), // filename
        (userId, filename) => {
          accessControl.clear();

          const attachment = accessControl.create(userId, filename);

          // 用户应该能获取自己附件的 URL
          const result = accessControl.getAccessUrl(attachment.id, userId);
          expect(result.url).not.toBeNull();
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("访问不存在的附件应该失败", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // userId
        fc.integer({ min: 1000, max: 9999 }), // nonExistentId
        (userId, nonExistentId) => {
          accessControl.clear();

          // 访问不存在的附件
          expect(accessControl.canAccess(nonExistentId, userId)).toBe(false);
          expect(accessControl.getById(nonExistentId, userId)).toBeNull();

          const deleteResult = accessControl.delete(nonExistentId, userId);
          expect(deleteResult.success).toBe(false);

          const urlResult = accessControl.getAccessUrl(nonExistentId, userId);
          expect(urlResult.url).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test("多用户场景下的隔离性", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.integer({ min: 1, max: 100 }),
            filename: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (users) => {
          accessControl.clear();

          // 每个用户创建附件
          const attachments = users.map((u) =>
            accessControl.create(u.userId, u.filename)
          );

          // 验证每个用户只能访问自己的附件
          for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            const owner = users[i];

            // 所有者可以访问
            expect(accessControl.canAccess(attachment.id, owner.userId)).toBe(
              true
            );

            // 其他用户不能访问
            for (let j = 0; j < users.length; j++) {
              if (users[j].userId !== owner.userId) {
                expect(
                  accessControl.canAccess(attachment.id, users[j].userId)
                ).toBe(false);
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
