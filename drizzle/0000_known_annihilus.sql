CREATE TABLE `agencies` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `closings` (
	`id` text PRIMARY KEY NOT NULL,
	`agency` text NOT NULL,
	`amount` integer NOT NULL,
	`expected` integer NOT NULL,
	`note` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`agency` text NOT NULL,
	`order_id` text,
	`actor` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`request_key` text NOT NULL,
	`agency` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`mode` text NOT NULL,
	`items` text NOT NULL,
	`note` text NOT NULL,
	`subtotal` integer NOT NULL,
	`fee` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`driver` text,
	`driver_name` text,
	`paid_method` text,
	`collector` text,
	`collector_name` text,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_unique` ON `orders` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);--> statement-breakpoint
CREATE TABLE `remittances` (
	`id` text PRIMARY KEY NOT NULL,
	`agency` text NOT NULL,
	`driver` text NOT NULL,
	`driver_name` text NOT NULL,
	`amount` integer NOT NULL,
	`actor` text NOT NULL,
	`actor_name` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`agency` text,
	`hash` text NOT NULL,
	`salt` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_username_unique` ON `staff` (`username`);--> statement-breakpoint
CREATE INDEX orders_agency_status ON orders(agency,status,created);
--> statement-breakpoint
CREATE INDEX orders_driver ON orders(driver);
--> statement-breakpoint
CREATE INDEX orders_collector ON orders(collector);
--> statement-breakpoint
CREATE TRIGGER orders_agency_immutable BEFORE UPDATE OF agency ON orders WHEN NEW.agency!=OLD.agency BEGIN SELECT RAISE(ABORT,'order_agency_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER orders_finance_immutable BEFORE UPDATE ON orders WHEN OLD.paid_method IS NOT NULL AND (NEW.paid_method IS NOT OLD.paid_method OR NEW.collector IS NOT OLD.collector OR NEW.total!=OLD.total OR NEW.agency!=OLD.agency OR NEW.status='cancelled') BEGIN SELECT RAISE(ABORT,'payment_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER orders_no_delete BEFORE DELETE ON orders BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER remittance_balance BEFORE INSERT ON remittances WHEN NEW.amount<=0 OR NEW.amount>(SELECT COALESCE(SUM(total),0) FROM orders WHERE collector=NEW.driver AND agency=NEW.agency AND paid_method='cash')-(SELECT COALESCE(SUM(amount),0) FROM remittances WHERE driver=NEW.driver AND agency=NEW.agency) BEGIN SELECT RAISE(ABORT,'cash_balance'); END;
--> statement-breakpoint
CREATE TRIGGER remittance_no_update BEFORE UPDATE ON remittances BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER remittance_no_delete BEFORE DELETE ON remittances BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER closing_no_update BEFORE UPDATE ON closings BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER closing_no_delete BEFORE DELETE ON closings BEGIN SELECT RAISE(ABORT,'history_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER last_master BEFORE UPDATE ON staff WHEN OLD.role='master' AND OLD.active=1 AND OLD.deleted=0 AND (NEW.role!='master' OR NEW.active=0 OR NEW.deleted=1) AND (SELECT COUNT(*) FROM staff WHERE role='master' AND active=1 AND deleted=0)<=1 BEGIN SELECT RAISE(ABORT,'last_master'); END;
--> statement-breakpoint
CREATE TRIGGER staff_pending BEFORE UPDATE ON staff WHEN OLD.role='driver' AND (NEW.role!=OLD.role OR NEW.agency IS NOT OLD.agency OR NEW.active=0 OR NEW.deleted=1) AND (EXISTS(SELECT 1 FROM orders WHERE driver=OLD.id AND status NOT IN ('delivered','cancelled')) OR (SELECT COALESCE(SUM(total),0) FROM orders WHERE collector=OLD.id AND paid_method='cash')>(SELECT COALESCE(SUM(amount),0) FROM remittances WHERE driver=OLD.id)) BEGIN SELECT RAISE(ABORT,'driver_pending'); END;
