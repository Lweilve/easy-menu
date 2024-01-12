<template>
  <el-config-provider :locale="locale" size="large">
    <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="开始日期" prop="dateString">
        <el-date-picker
          v-model="form.dateString"
          type="date"
          placeholder="请选择开始日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="菜单数据" prop="text">
        <el-input v-model="form.text" type="textarea" rows="7" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit(ruleFormRef)"
          >生成</el-button
        >
      </el-form-item>
      <el-form-item label="生成数据">
        <el-input v-model="form.data" type="textarea" rows="7" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleTo">跳转</el-button>
      </el-form-item>
    </el-form>
  </el-config-provider>
</template>

<script lang="ts" setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { ElMessage } from "element-plus";
import { h, ref, reactive } from "vue";

const ruleFormRef = ref();
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
  if (str && [",", "，"].includes(str.charAt(0))) {
    str = str.slice(1);
  }
  return str || "";
};
const copyToClipboard = (text) => {
  var textarea = document.createElement("textarea"); //创建临时的textarea元素
  textarea.value = text; //设置要复制的文本内容
  document.body.appendChild(textarea); //添加到页面上
  textarea.select(); //选中文本区域
  try {
    var successful = document.execCommand("copy"); //执行复制命令
    var msg = successful ? "成功" : "失败";
    console.log("已复制到剪贴板", msg);
  } catch (err) {
    console.error("无法复制到剪贴板", err);
  } finally {
    document.body.removeChild(textarea); //移除临时的textarea元素
  }
};
const onSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      const { dateString, text } = form;
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

      meals.forEach((meal, index) => {
        const day = days[index];
        const sections = meal.split(/早餐|午餐|晚餐/).filter(item => item.trim() !== '');
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
      form.data = json;
      ElMessage("已成功生成数据，请复制后点击跳转按钮！");
      copyToClipboard(json)
    } else {
      console.log("error submit!", fields);
    }
  });
};

const handleTo = () => {
  window.open("https://docxtemplater.com/demo/#/view/cyber-security-report");
};
</script>
