<template>
  <el-config-provider :locale="locale" size="large">
    <div class="header">
      <h1 class="title">食堂菜谱生成系统</h1>
      <div class="tour" @click="handleClickTour">指南</div>
    </div>
    <el-form
      ref="ruleFormRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="top"
    >
      <el-form-item ref="ref1" label="开始日期" prop="dateString">
        <el-date-picker
          v-model="form.dateString"
          type="date"
          placeholder="请选择开始日期"
          style="width: 100%"
          :editable="false"
          @click="showCustomDatePicker"
        />
      </el-form-item>
      <el-form-item ref="ref2" label="菜单数据" prop="text">
        <el-input v-model="form.text" type="textarea" rows="9" />
      </el-form-item>
      <el-form-item>
        <el-button
          ref="ref3"
          style="width: 100%"
          type="primary"
          size="large"
          @click="onSubmit(ruleFormRef)"
        >
          生成菜单
        </el-button>
      </el-form-item>
    </el-form>
    <el-tour v-model="openTour">
      <el-tour-step
        :target="ref1?.$el"
        title="第一步：选择日期"
        description="选择菜单数据开始的第一天"
      />
      <el-tour-step
        :target="ref2?.$el"
        title="第二步：粘贴菜单数据"
        description="将菜单数据粘贴进该输入框"
      />
      <el-tour-step
        :target="ref3?.$el"
        title="第三步：点击生成按钮"
        description="将自动下载菜单文件"
      />
    </el-tour>
  </el-config-provider>
</template>

<script lang="ts" setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { ElMessage, ElNotification } from "element-plus";
import { ref, reactive, onMounted } from "vue";
import PizZip from "pizzip"; //"pizzip": "^3.1.4",
import Docxtemplater from "docxtemplater"; //"docxtemplater": "^3.34.3",

// #region 引导
const openTour = ref(false);
const ref1 = ref();
const ref2 = ref();
const ref3 = ref();
const handleClickTour = () => {
  openTour.value = true;
}
// #endregion 引导

const isMicromessenger = ref(false);

const filterArr = ["", ",", "，", ".", "。", ";", "；", ":"];

const ruleFormRef = ref();

const templateDays = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];
const form = reactive({
  dateString: "",
  text: "",
});
const rules = reactive({
  dateString: [
    { required: true, message: "请选择开始日期", trigger: "change" },
  ],
  text: [
    {
      required: true,
      message: "请输入菜单数据",
      trigger: "change",
    },
  ],
});
const locale = reactive(zhCn);
const renderText = (str) => {
  if (str && filterArr.includes(str.charAt(0))) {
    str = str.slice(1);
  }
  return str || "";
};
// 获取开始日期为星期几
const getWeekday = (string) => {
  var date = new Date(string);
  var dayOfWeek = date.getDay();
  return templateDays[dayOfWeek];
};

const onSubmit = async (formEl) => {
  if (isMicromessenger.value) {
    return ElMessage({
        message: "当前为微信浏览器，请使用手机浏览器生成文件",
        type: "warning",
        duration: 5000,
        offset: 24,
      });
  }
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      const { dateString, text } = form;
      // 初始数据
      const menu = {
        Date0: {},
        Date1: {},
        Date2: {},
        Date3: {},
        Date4: {},
        Date5: {},
        Date6: {},
      };
      for (let i = 0; i < 7; i++) {
        const dateKey = `Date${i}`;
        menu[dateKey] = {
          [dateKey]: "",
          [`${dateKey}Week`]: "",
          [`${dateKey}Breakfast`]: "",
          [`${dateKey}Lunch`]: "",
          [`${dateKey}Supper`]: "",
        };
      }
      // 处理数据，去除换行和空格
      let cleanedText = text.replace(/\s|\n/g, "");
      // 分离菜单数据
      const pattern =
        /(星期日|星期一|星期二|星期三|星期四|星期五|星期六)([^星期]+)/g;
      const matches = cleanedText.matchAll(pattern);
      const result = new Map();
      for (const match of matches) {
        const day = match[1];
        const value = match[2].trim();
        result.set(day, value);
      }
      // 判断使用哪个模版：没有周末的用5，单个周末6，双周末7
      let menuType = 5;
      result.forEach((value, key) => {
        if (["星期日", "星期六"].includes(key)) {
          menuType += 1;
        }
      });
      // 判断Date1是从星期几开始
      const startDayWeek = getWeekday(dateString);
      let DateWeekArray = [];
      if (startDayWeek === "星期日") {
        DateWeekArray = templateDays;
      } else if (startDayWeek === "星期六") {
        DateWeekArray = [
          "星期六",
          "星期日",
          "星期一",
          "星期二",
          "星期三",
          "星期四",
          "星期五",
        ];
      } else {
        DateWeekArray = [
          "星期一",
          "星期二",
          "星期三",
          "星期四",
          "星期五",
          "星期六",
          "星期日",
        ];
      }
      // 获取开始星期的下标
      const startDayWeekIndex = DateWeekArray.findIndex(
        (state) => state === startDayWeek
      );
      for (let index = 0; index < DateWeekArray.length; index++) {
        const element = DateWeekArray[index];
        const value = result.get(element);

        if (value) {
          const pattern =
            /(早餐|午餐|晚餐)([^早餐午餐晚餐]*?)(?=早餐|午餐|晚餐|$)/g;
          const matches = value.matchAll(pattern);
          const sections = ["", "", ""];
          for (const match of matches) {
            const name = match[1];
            const value = match[2];
            switch (name) {
              case "早餐":
                sections[0] = value;
                break;
              case "午餐":
                sections[1] = value;
                break;
              case "晚餐":
                sections[2] = value;
                break;
              default:
                break;
            }
            sections.push(value);
          }
          menu[`Date${index}`][`Date${index}Breakfast`] = renderText(
            sections[0]
          );
          menu[`Date${index}`][`Date${index}Lunch`] = renderText(sections[1]);
          menu[`Date${index}`][`Date${index}Supper`] = renderText(sections[2]);
        }
        const date = new Date(dateString);
        date.setDate(date.getDate() + index - startDayWeekIndex);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        menu[`Date${index}`][`Date${index}`] = `${month}月${day}日`;
        menu[`Date${index}`][`Date${index}Week`] = element;
      }
      const { Date0, Date1, Date2, Date3, Date4, Date5, Date6 } = menu;
      renderDoc(
        {
          ...Date0,
          ...Date1,
          ...Date2,
          ...Date3,
          ...Date4,
          ...Date5,
          ...Date6,
        },
        menuType,
        dateString
      );
      ElMessage({
        message: "已成功生成文件",
        type: "success",
        duration: 5000,
        offset: 24,
      });
    } else {
      console.log("error submit!", fields);
    }
  });
};

const renderDoc = async (json, menuType, dateString) => {
  const template = await fetch(`./menu${menuType}.docx`).then((res) =>
    res.arrayBuffer()
  );
  const zip = new PizZip(template);

  const doc = new Docxtemplater().loadZip(zip);
  console.log("------看看json-------", json);
  console.log("------end-------");
  // 替换占位符
  doc.setData(json);
  doc.render();

  // 生成 Word 文件并下载
  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fileName = `食堂菜谱${month}月${day}日.docx`;

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(out, fileName);
  } else {
    const url = window.URL.createObjectURL(out);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const showCustomDatePicker = (event) => {
  event.preventDefault();
};

onMounted(() => {
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.match(/MicroMessenger/i) == "micromessenger") {
    isMicromessenger.value = true;
    ElNotification({
      title: "当前为微信浏览器",
      message: "请点击右上角选择在浏览器中打开",
      type: "warning",
      duration: 0,
    });
  }
});
</script>

<style>
.header {
  position: relative;
}
.title {
  margin-bottom: 20px;
  text-align: center;
}
.tour {
  position: absolute;
  top: 50%;
  right: 0;
  cursor: pointer;
  /* font-size: 18px; */
}
</style>
