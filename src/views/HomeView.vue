<template>
  <el-config-provider :locale="locale" size="large">
    <h1 class="title">食堂菜谱生成系统</h1>
    <el-form
      ref="ruleFormRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="top"
    >
      <el-form-item label="开始日期" prop="dateString">
        <el-date-picker
          v-model="form.dateString"
          type="date"
          placeholder="请选择开始日期"
          style="width: 100%"
          :editable="false"
          @click="showCustomDatePicker"
        />
      </el-form-item>
      <el-form-item label="菜单数据" prop="text">
        <el-input v-model="form.text" type="textarea" rows="7" />
      </el-form-item>
      <el-form-item>
        <el-button
          style="width: 100%"
          type="primary"
          size="large"
          @click="onSubmit(ruleFormRef)"
        >
          生成菜单
        </el-button>
      </el-form-item>
    </el-form>
  </el-config-provider>
</template>

<script lang="ts" setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { ElMessage, ElNotification } from "element-plus";
import { ref, reactive, onMounted } from "vue";
import PizZip from "pizzip"; //"pizzip": "^3.1.4",
import Docxtemplater from "docxtemplater"; //"docxtemplater": "^3.34.3",

const chineseToEnglish = {
  星期一: "monday",
  星期二: "tuesday",
  星期三: "wednesday",
  星期四: "thursday",
  星期五: "friday",
};
const filterArr = ['', ',', '，', '.' , '。', ';', '；', ':']

const ruleFormRef = ref();

const templateDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
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

const onSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      const { dateString, text } = form;
      let cleanedText = text.replace(/\s|\n/g, "");
      let index = cleanedText.indexOf("星期一");
      cleanedText = cleanedText.slice(index);
      const meals = cleanedText
        .split(/星期[一二三四五]/)
        .filter((item) => !filterArr.includes(item));
      let days = [...templateDays];
      const menu = {
        monday: {
          mondayBreakfast: "",
          mondayLunch: "",
          mondaySupper: "",
        },
        tuesday: { tuesdayBreakfast: "", tuesdayLunch: "", tuesdaySupper: "" },
        wednesday: {
          wednesdayBreakfast: "",
          wednesdayLunch: "",
          wednesdaySupper: "",
        },
        thursday: {
          thursdayBreakfast: "",
          thursdayLunch: "",
          thursdaySupper: "",
        },
        friday: { fridayBreakfast: "", fridayLunch: "", fridaySupper: "" },
      };
      const regex = /星期一|星期二|星期三|星期四|星期五/g;
      const matches = text.match(regex);
      let missingDays = [];
      if (matches && matches.length !== 5) {
        missingDays = ["星期一", "星期二", "星期三", "星期四", "星期五"].filter(
          (day) => !matches?.includes(day)
        );
        days = days.filter((day) => {
          const chineseDay = missingDays.find((chinese) =>
            day.includes(chineseToEnglish[chinese])
          );
          return !chineseDay;
        });
      }
      meals.forEach((meal, index) => {
        const day = days[index];

        const sections = meal
          .split(/早餐|午餐|晚餐/)
          .filter((item) =>  !filterArr.includes(item));
        menu[day] = {
          [`${day}Breakfast`]: renderText(sections[0]),
          [`${day}Lunch`]: renderText(sections[1]),
          [`${day}Supper`]: renderText(sections[2]),
        };
      });
      const { monday, tuesday, wednesday, thursday, friday } = menu;
      let date = new Date(dateString);
      const result = {};

      for (var i = 0; i < 5; i++) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        result[`${templateDays[i]}Date`] = `${month}月${day}日`;
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
      renderDoc(data);
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

const renderDoc = async (json) => {
  const template = await fetch("./menu.docx").then((res) => res.arrayBuffer());
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
  const fileName = `食堂菜谱${json.mondayDate}.docx`;

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
    ElNotification({
      title: "当前为微信浏览器",
      message: "请点击右上角选择在浏览器中打开",
      type: "warning",
      duration: 0
    });
  }
});
</script>

<style>
.title {
  margin-bottom: 20px;
  text-align: center;
}
</style>
