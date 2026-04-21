# GitHub Pages 部署指南

## 问题诊断

如果访问 https://johnxwzhang.github.io/PNGcut/ 显示空白页面，可能是因为：

1. **资源路径错误**：dist 文件夹中的文件使用了绝对路径而不是相对路径
2. **GitHub Pages 设置不正确**：需要配置为使用 GitHub Actions 部署

## 解决方案

### 步骤 1: 配置 GitHub Pages 使用 GitHub Actions

1. 访问：https://github.com/johnxwzhang/PNGcut/settings/pages
2. 在 "Source" 下拉菜单中，选择 **"GitHub Actions"**（不是 "Deploy from a branch"）
3. 保存设置

### 步骤 2: 确保代码已推送

确保以下文件已推送到 GitHub：
- `.github/workflows/deploy.yml` - GitHub Actions 工作流
- `vite.config.js` - 已配置 `base: '/PNGcut/'`
- 所有源代码文件

### 步骤 3: 触发自动部署

GitHub Actions 会在以下情况自动运行：
- 每次推送到 main 分支时
- 或者手动触发：
  1. 访问：https://github.com/johnxwzhang/PNGcut/actions
  2. 点击 "Deploy to GitHub Pages" 工作流
  3. 点击 "Run workflow" 按钮

### 步骤 4: 等待部署完成

1. 访问 Actions 页面查看构建进度：https://github.com/johnxwzhang/PNGcut/actions
2. 等待绿色对勾出现（通常需要 1-2 分钟）
3. 部署完成后，等待 1-2 分钟让 GitHub Pages 更新
4. 访问：https://johnxwzhang.github.io/PNGcut/

## 验证部署

部署成功后，你应该能看到：
- 页面正常显示
- 开发者工具（F12）中没有 404 错误
- 所有资源文件都能正常加载

## 如果还是不行

如果仍然显示空白页面：

1. **清除浏览器缓存**：按 Ctrl+F5 强制刷新
2. **检查浏览器控制台**：按 F12 查看是否有错误信息
3. **验证文件路径**：检查 dist/index.html 中的路径是否包含 `/PNGcut/`
4. **检查 Actions**：确保 GitHub Actions 工作流成功完成

