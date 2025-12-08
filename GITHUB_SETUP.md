# GitHub 推送指南

## 步骤 1: 在 GitHub 上创建新仓库

1. 访问 https://github.com
2. 点击右上角的 **+** → **New repository**
3. 填写信息：
   - Repository name: `PNGcut`（或你想要的名称）
   - Description: `A smart web tool that automatically detects and extracts individual UI components from PNG images with transparency`
   - 选择 **Public** 或 **Private**
   - **不要勾选** "Initialize this repository with a README"（因为我们已经有了代码）
4. 点击 **Create repository**

## 步骤 2: 连接本地仓库并推送

创建仓库后，GitHub 会显示命令，或者直接运行以下命令：

### 方法一：使用 HTTPS（推荐新手）

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名，REPO_NAME 为仓库名称
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### 方法二：使用 SSH（需要配置 SSH 密钥）

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名，REPO_NAME 为仓库名称
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## 示例

如果你的 GitHub 用户名是 `john`，仓库名是 `PNGcut`，命令应该是：

```bash
git remote add origin https://github.com/john/PNGcut.git
git branch -M main
git push -u origin main
```

## 注意事项

- 如果提示输入用户名和密码，建议使用 GitHub Personal Access Token 而不是密码
- 如果当前分支是 `master` 而不是 `main`，运行 `git branch -M main` 会将分支重命名
- 首次推送后，以后只需要运行 `git push` 即可

## 后续更新代码

以后修改代码后，使用以下命令更新 GitHub：

```bash
git add .
git commit -m "你的提交信息"
git push
```

