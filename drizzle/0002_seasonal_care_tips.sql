CREATE TABLE `seasonalCareTips` (
  `id` int AUTO_INCREMENT NOT NULL,
  `seasonKey` varchar(80) NOT NULL,
  `titleEn` varchar(180) NOT NULL,
  `titleAr` varchar(180) NOT NULL,
  `bodyEn` text NOT NULL,
  `bodyAr` text NOT NULL,
  `icon` varchar(40) NOT NULL DEFAULT 'sun',
  `accent` varchar(20) NOT NULL DEFAULT '#76a68f',
  `startMonth` int NOT NULL,
  `endMonth` int NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `seasonalCareTips_id` PRIMARY KEY(`id`),
  CONSTRAINT `seasonalCareTips_seasonKey_unique` UNIQUE(`seasonKey`)
);
--> statement-breakpoint
CREATE INDEX `seasonal_care_tips_active_idx` ON `seasonalCareTips` (`isActive`,`startMonth`,`endMonth`);
--> statement-breakpoint
INSERT INTO `seasonalCareTips` (`seasonKey`,`titleEn`,`titleAr`,`bodyEn`,`bodyAr`,`icon`,`accent`,`startMonth`,`endMonth`) VALUES
('hurghada_summer_heat','Hurghada summer heat','حر الصيف في الغردقة','Refresh water more than once daily, provide shade and airflow, and keep cages away from midday sun.','غيّر المياه أكثر من مرة يوميًا، وفّر ظلًا وتهوية جيدة، ولا تترك القفص في شمس الظهر.','thermometer','#d26246',5,8),
('moulting_season','Moulting season','موسم تغيير الريش','Offer a balanced diet and calcium source, reduce stress, and avoid cold baths or frequent cage moves.','قدّم غذاءً متوازنًا ومصدر كالسيوم، وقلّل التوتر وتجنّب الاستحمام البارد أو نقل القفص كثيرًا.','feather','#76a68f',8,10),
('breeding_season','Breeding season','فترة التزاوج','Watch behaviour and nutrition, and only start breeding with a healthy pair and a safe setup.','راقب السلوك والتغذية، ولا تبدأ التفريخ إلا مع زوج سليم ومكان آمن واستعداد للرعاية.','sun','#c49752',1,5);
