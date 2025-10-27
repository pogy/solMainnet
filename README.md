## sol mainnet

depend:
mysql
CREATE TABLE `common_airdroip_task` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_id` varchar(128) DEFAULT NULL,
  `useragent` varchar(512) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `referral_user_id` text CHARACTER SET utf8 COLLATE utf8_general_ci,
  `invite_code` varchar(255) DEFAULT NULL,
  `boot_username` varchar(255) DEFAULT NULL,
  `is_init` tinyint DEFAULT '0',
  `tg_phone` varchar(128) DEFAULT NULL,
  `tg_link` text COMMENT 'h5链接',
  `tg_web_app_data` text CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT '登录信息',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `twitter_handle` varchar(255) DEFAULT NULL COMMENT 'twitter handle',
  `discord_id` varchar(255) DEFAULT NULL COMMENT 'discord id',
  `discord_token` text CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'discord token',
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `wallet_index` varchar(255) DEFAULT NULL,
  `ton_wallet_private` text CHARACTER SET utf8 COLLATE utf8_general_ci,
  `sol_wallet_private` text CHARACTER SET utf8 COLLATE utf8_general_ci,
  `eth_wallet_private` text CHARACTER SET utf8 COLLATE utf8_general_ci,
  `ton_wallet_address` varchar(255) DEFAULT NULL,
  `sol_wallet_address` varchar(255) DEFAULT NULL,
  `eth_wallet_address` varchar(255) DEFAULT NULL,
  `airdrop_num` int DEFAULT NULL,
  `airdrop_claim_num` int DEFAULT NULL,
  `airdrop_claim_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '空投时间',
  `online_status` varchar(255) DEFAULT 'ONLINE',
  `claim_status` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT 'NO',
  `status` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT 'VALID' COMMENT 'VALID/INVALID',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `balance` double DEFAULT NULL,
  `param1` text,
  `param2` text,
  `param3` text,
  `param4` text,
  `param5` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33640 DEFAULT CHARSET=utf8 COMMENT='common_airdroip_task';


project:
jupiter 
...

