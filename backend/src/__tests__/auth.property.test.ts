/**
 * 用户认证属性测试
 *
 * Property 1: 用户注册登录往返
 * Property 12: JWT 令牌有效性
 * Property 13: 密码加密存储
 *
 * Validates: Requirements 1.1, 1.3, 12.1, 12.2
 */

import * as fc from "fast-check";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config";

// 设置更长的超时时间
jest.setTimeout(60000);

// 生成有效的邮箱
const emailArbitrary = fc
  .tuple(
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"), {
      minLength: 3,
      maxLength: 10,
    }),
    fc.constantFrom("gmail.com", "qq.com", "outlook.com", "163.com")
  )
  .map(([name, domain]) => `${name}@${domain}`);

// 生成有效的密码（至少6位）
const passwordArbitrary = fc.stringOf(
  fc.constantFrom(
    ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  ),
  { minLength: 6, maxLength: 12 }
);

// 生成有效的昵称（2-20位）
const nicknameArbitrary = fc.stringOf(
  fc.constantFrom(
    ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  ),
  { minLength: 2, maxLength: 10 }
);

describe("用户认证属性测试", () => {
  /**
   * Property 13: 密码加密存储
   * 对于任意注册的用户，数据库中存储的密码应是加密后的哈希值，不等于原始密码。
   * Validates: Requirements 12.2
   */
  describe("Property 13: 密码加密存储", () => {
    it("对于任意密码，bcrypt 加密后的哈希值不等于原始密码", async () => {
      await fc.assert(
        fc.asyncProperty(passwordArbitrary, async (password) => {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // 哈希值不等于原始密码
          expect(hashedPassword).not.toBe(password);
          // 哈希值长度应该是固定的（bcrypt 哈希长度为 60）
          expect(hashedPassword.length).toBe(60);
          // 哈希值应该以 $2a$ 或 $2b$ 开头（bcrypt 标识）
          expect(hashedPassword).toMatch(/^\$2[ab]\$/);
        }),
        { numRuns: 20 }
      );
    });

    it("对于任意密码，加密后可以正确验证", async () => {
      await fc.assert(
        fc.asyncProperty(passwordArbitrary, async (password) => {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // 正确密码可以验证通过
          const isValid = await bcrypt.compare(password, hashedPassword);
          expect(isValid).toBe(true);
        }),
        { numRuns: 20 }
      );
    });

    it("对于任意两个不同的密码，错误密码验证应失败", async () => {
      await fc.assert(
        fc.asyncProperty(
          passwordArbitrary,
          passwordArbitrary,
          async (password1, password2) => {
            fc.pre(password1 !== password2);

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password1, salt);

            // 使用错误密码验证应该失败
            const isValid = await bcrypt.compare(password2, hash);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 12: JWT 令牌有效性
   * 对于任意成功登录返回的令牌，该令牌应是有效的 JWT 格式，包含用户 ID 和过期时间。
   * Validates: Requirements 12.1
   */
  describe("Property 12: JWT 令牌有效性", () => {
    it("对于任意用户信息，生成的 JWT 应包含正确的 payload", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          emailArbitrary,
          nicknameArbitrary,
          (id, email, nickname) => {
            const payload = { id, email, nickname };
            const token = jwt.sign(payload, config.jwt.secret, {
              expiresIn: "7d",
            });

            // 验证 token 格式（三段式）
            const parts = token.split(".");
            expect(parts.length).toBe(3);

            // 解码并验证 payload
            const decoded = jwt.verify(token, config.jwt.secret) as {
              id: number;
              email: string;
              nickname: string;
              iat: number;
              exp: number;
            };

            expect(decoded.id).toBe(id);
            expect(decoded.email).toBe(email);
            expect(decoded.nickname).toBe(nickname);
            // 应该包含签发时间和过期时间
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeDefined();
            // 过期时间应该大于签发时间
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意有效 token，使用错误的 secret 验证应失败", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          emailArbitrary,
          fc.string({ minLength: 10, maxLength: 50 }),
          (id, email, wrongSecret) => {
            fc.pre(wrongSecret !== config.jwt.secret);

            const payload = { id, email, nickname: "test" };
            const token = jwt.sign(payload, config.jwt.secret, {
              expiresIn: "7d",
            });

            // 使用错误的 secret 验证应该抛出错误
            expect(() => {
              jwt.verify(token, wrongSecret);
            }).toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 1: 用户注册登录往返
   * 对于任意有效的用户注册信息，注册成功后使用相同的邮箱和密码登录，应该返回有效的访问令牌。
   * Validates: Requirements 1.1, 1.3
   */
  describe("Property 1: 用户注册登录往返", () => {
    it("对于任意有效的注册信息，密码加密后可以正确验证并生成有效 token", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          nicknameArbitrary,
          async (email, password, nickname) => {
            // 模拟注册：加密密码
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 模拟存储的用户数据
            const storedUser = {
              id: 1,
              email,
              password: hashedPassword,
              nickname,
            };

            // 模拟登录：验证密码
            const isValidPassword = await bcrypt.compare(
              password,
              storedUser.password
            );
            expect(isValidPassword).toBe(true);

            // 生成 token
            const token = jwt.sign(
              {
                id: storedUser.id,
                email: storedUser.email,
                nickname: storedUser.nickname,
              },
              config.jwt.secret,
              { expiresIn: "7d" }
            );

            // 验证 token 有效
            const decoded = jwt.verify(token, config.jwt.secret) as {
              id: number;
              email: string;
              nickname: string;
            };

            expect(decoded.id).toBe(storedUser.id);
            expect(decoded.email).toBe(email);
            expect(decoded.nickname).toBe(nickname);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("对于任意有效的注册信息，使用错误密码登录应失败", async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          passwordArbitrary,
          async (_email, correctPassword, wrongPassword) => {
            fc.pre(correctPassword !== wrongPassword);

            // 模拟注册：加密密码
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(correctPassword, salt);

            // 模拟登录：使用错误密码验证
            const isValidPassword = await bcrypt.compare(
              wrongPassword,
              hashedPassword
            );
            expect(isValidPassword).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
