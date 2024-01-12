const text =
  "星期一 早餐 三层，肉卷，蒜苗，芹菜，炒粄条，打茶 午餐， 鱼，时菜，白萝卜焖鸭，肉碎蒸梅菜 晚餐 时菜，蒜苗炒肉卷，红烧鸡翅，（红萝卜，青红椒，木耳，炒肉丝） 星期二 早餐， 芹菜，瘦肉粥，蒸玉米 午餐 鱼，时菜，三层焖莲藕，蒸蛋 晚餐 时菜，葱炒鱼卷，鸡爪焖花生，三层炒西芹 星期三 早餐 瘦肉，芹菜，干面条汤 午餐 鱼，时菜，猪脚焖花生，三层炒腐竹 晚餐 时菜，（麻辣香锅，玉米，小原味肠，活虾，芋条）三层炒蒜芯，蒸咸鸭蛋 星期四 早餐 白粥，三层炒咸菜。花卷 午餐 时菜 鱼，时菜，芋头焖排骨，三层炒豆角 晚餐 鱼，时菜，红烧三层，芹菜鱼丸 星期五 早餐 蒜苗，虾，瘦肉，芹菜煮生面条 午餐 鱼，时菜，牛腩煲白萝卜，卤蛋";
const dateString = "2024-01-15";
const cleanedText = text.replace(/\n/g, "");

const meals = cleanedText.split(/星期[一二三四五]/).filter(Boolean);
const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const menu = {
  monday: {},
  tuesday: {},
  wednesday: {},
  thursday: {},
  friday: {},
};
const renderText = (str) => {
  if (str && [",", "，"].includes(str.charAt(0))) {
    str = str.slice(1);
  }
  return str || "";
};
meals.forEach((meal, index) => {
  const day = days[index];
  console.log(`------${index}看看meal-------`, meal);
  const sections = meal.split(/早餐|午餐|晚餐/).filter(item => item.trim() !== '');
  console.log(`------${index}看看sections-------`, sections);
  menu[day] = {
    [`${day}Breakfast`]: renderText(sections[0]?.trim()),
    [`${day}Lunch`]: renderText(sections[1]?.trim()),
    [`${day}Supper`]: renderText(sections[2]?.trim()),
  };
});
const { monday, tuesday, wednesday, thursday, friday } = menu;

let date = new Date(dateString);
const result = {};

for (var i = 0; i < 5; i++) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  result[`${days[i]}Date`] = `${month}月${day}日`;
  date.setDate(date.getDate() + 1);
}

const data = {
  ...result,
  ...monday,
  ...tuesday,
  ...wednesday,
  ...thursday,
  ...friday,
};
const json = JSON.stringify(data);
console.log("------看看data-------", data);
console.log("------end-------");
