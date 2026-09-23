CREATE TABLE `priceGuide` (
  `id` varchar(80) NOT NULL,
  `birdEn` varchar(120) NOT NULL,
  `birdAr` varchar(120) NOT NULL,
  `range` varchar(80) NOT NULL,
  `sourceEn` varchar(240) NOT NULL,
  `sourceAr` varchar(240) NOT NULL,
  `sourceUrl` varchar(600) NOT NULL,
  `checkedOn` varchar(10) NOT NULL,
  `noteEn` text NOT NULL,
  `noteAr` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `price_guide_checked_idx` (`checkedOn`)
);

INSERT IGNORE INTO `priceGuide` (`id`, `birdEn`, `birdAr`, `range`, `sourceEn`, `sourceAr`, `sourceUrl`, `checkedOn`, `noteEn`, `noteAr`) VALUES
('budgie', 'Budgerigar', 'بادجي', '90–350 ج.م', 'Listings and market-watch indicator', 'مؤشر إعلانات ومتابعة سوقية', 'https://4sw.app/category/7/69/birds-and-pigeons', '2026-09-23', 'Varies by colour, age, and training', 'يتغير حسب اللون والعمر والتدريب'),
('cockatiel', 'Cockatiel', 'كوكتيل', '300–1,200 ج.م', 'Listings and market-watch indicator', 'مؤشر إعلانات ومتابعة سوقية', 'https://4sw.app/category/7/69/birds-and-pigeons', '2026-09-23', 'Mutation and tameness strongly affect price', 'الطفرة والترويض يؤثران بشدة على السعر'),
('lovebird', 'Lovebird', 'روز / فيشر', '250–900 ج.م', 'Listings and market-watch indicator', 'مؤشر إعلانات ومتابعة سوقية', 'https://4sw.app/category/7/69/birds-and-pigeons', '2026-09-23', 'Price may be per bird or pair', 'السعر للزوج أو للطائر حسب الإعلان'),
('zebra', 'Zebra finch', 'زيبرا', '80–300 ج.م', 'Listings and market-watch indicator', 'مؤشر إعلانات ومتابعة سوقية', 'https://4sw.app/category/7/69/birds-and-pigeons', '2026-09-23', 'Confirm quantity and condition before comparing', 'يفضل التأكد من العدد والحالة قبل المقارنة');
