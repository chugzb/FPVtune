import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	status: text('status').notNull(),
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tutorialFeedback = pgTable("tutorial_feedback", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	tutorialId: text('tutorial_id').notNull(),
	rating: text('rating').notNull(), // 'helpful' or 'not-helpful'
	comment: text('comment'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tuneOrder = pgTable("tune_order", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	orderNumber: text('order_number').unique().notNull(),

	// Creem 支付信息
	creemCheckoutId: text('creem_checkout_id'),
	creemCustomerId: text('creem_customer_id'),

	// 用户信息
	customerEmail: text('customer_email').notNull(),
	locale: text('locale').default('en'),

	// 用户输入参数
	blackboxFilename: text('blackbox_filename'),
	blackboxFileSize: integer('blackbox_file_size'),
	blackboxContent: text('blackbox_content'), // 存储文件内容（前50KB），避免 R2 下载问题
	cliDumpFilename: text('cli_dump_filename'),
	cliDumpFileSize: integer('cli_dump_file_size'),
	cliDumpUrl: text('cli_dump_url'),
	cliDumpContent: text('cli_dump_content'), // 存储 CLI dump 内容
	problems: text('problems'),
	goals: text('goals'),
	flyingStyle: text('flying_style'),
	frameSize: text('frame_size'),
	motorSize: text('motor_size'),
	motorKv: text('motor_kv'),
	battery: text('battery'),
	propeller: text('propeller'),
	motorTemp: text('motor_temp'),
	weight: text('weight'),
	additionalNotes: text('additional_notes'),

	// AI 分析结果
	analysisResult: jsonb('analysis_result'),
	cliCommands: text('cli_commands'),

	// 文件存证
	pdfUrl: text('pdf_url'),
	pdfHash: text('pdf_hash'),
	blackboxUrl: text('blackbox_url'),

	// 结果链接
	resultUrl: text('result_url'),

	// 邮件追踪
	emailSentAt: timestamp('email_sent_at'),
	emailMessageId: text('email_message_id'),
	emailDeliveredAt: timestamp('email_delivered_at'),

	// 订单状态: pending -> paid -> processing -> completed / failed
	status: text('status').default('pending').notNull(),
	amount: integer('amount'),
	currency: text('currency').default('USD'),

	// 测试码
	promoCodeId: text('promo_code_id'),

	// 时间戳
	createdAt: timestamp('created_at').notNull().defaultNow(),
	paidAt: timestamp('paid_at'),
	completedAt: timestamp('completed_at'),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 测试码/优惠码表
export const promoCode = pgTable("promo_code", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	code: text('code').notNull().unique(),
	// single: 一次性码, unlimited: 永久码, limited: 限次码
	type: text('type').notNull().default('single'),
	maxUses: integer('max_uses').default(1),
	usedCount: integer('used_count').notNull().default(0),
	validFrom: timestamp('valid_from').defaultNow(),
	validUntil: timestamp('valid_until'),
	createdBy: text('created_by'),
	note: text('note'),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 测试码使用记录
export const promoCodeUsage = pgTable("promo_code_usage", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	promoCodeId: text('promo_code_id').notNull().references(() => promoCode.id, { onDelete: 'cascade' }),
	orderId: text('order_id').references(() => tuneOrder.id, { onDelete: 'set null' }),
	customerEmail: text('customer_email').notNull(),
	usedAt: timestamp('used_at').notNull().defaultNow(),
});
