const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const download = require('download-git-repo');
const { exit } = require('process');
const inquire = require('inquirer');
const {
  parseCmdParams,
  copyFiles,
  getGitUser,
  log,
  runCmd,
} = require('../utils');
const { RepoPath, InquireConfig } = require('../utils/config');

class Creator {
  constructor(source, destination, options = {}) {
    this.source = source;
    this.cmdParams = parseCmdParams(destination);
    this.repoMaps = Object.assign(
      {
        repo: RepoPath,
        temp: path.join(__dirname, '../../__temp__'),
        target: this.genTargetPath(this.source),
      },
      options
    );
    this.gitUser = {};
    this.spinner = ora();
    this.init();
  }

  // 生成目标文件夹的绝对路径,
  // 当前目录拼接上项目名称即为项目路径
  genTargetPath(relPath) {
    return path.resolve(process.cwd(), relPath);
  }

  async init() {
    try {
      await this.checkFolderExist();
      await this.downloadRepo();
      await this.copyRepoFiles();
      await this.updatePkgFile();
      await this.initGit();
      await this.runApp();
    } catch (error) {
      exit(1);
    } finally {
      this.spinner.stop();
    }
  }

  checkFolderExist() {
    return new Promise(async (resolve, reject) => {
      const { target } = this.repoMaps;

      // 配置了强制删除存在的文件夹
      if (this.cmdParams.force) {
        await fs.removeSync(target);
        return resolve();
      }

      try {
        // 不存在则创建项目
        const isTarget = await fs.pathExistsSync(target);
        if (!isTarget) return resolve();

        // 存在项目，选择是否覆盖
        const { recover } = await inquire.prompt(InquireConfig.folderExist);
        if (recover === 'cover') {
          await fs.removeSync(target);
          return resolve();
        } else if (recover === 'newFolder') {
          const { inputNewName } = await inquire.prompt(InquireConfig.rename);
          this.source = inputNewName;
          this.repoMaps.target = this.genTargetPath(`./${inputNewName}`);
          return resolve();
        } else {
          exit(1);
        }
      } catch (error) {
        log.error('error: ', error);
        exit(1);
      }
    });
  }

  downloadRepo() {
    this.spinner.start('正在拉取项目模板...')
    const {repo, temp } = this.repoMaps

    return new Promise(async (resolve, reject) => {
      download(repo, temp, async err => {
        if (err) return reject(err)
        this.spinner.succeed('模板下载成功!')
        // 删除临时文件
        await fs.removeSync(temp)
        return resolve()
      })
    })
  }

  async copyRepoFiles() {
    const {target, temp } = this.repoMaps
    await copyFiles(temp, target, ['./git', './changelogs'])
  }

  async updatePkgFile() {
    this.spinner.start('正在更新package.json...')
    const pkgPath = path.resolve(this.repoMaps.target, 'package.json')
    const unnecessaryKey = ['keywords', 'license', 'files']
    const {name = '', email = ''} = await getGitUser()
    const jsonData = fs.readJSONSync(pkgPath)

    unnecessaryKey.forEach(key => delete jsonData[key])
    Object.assign(jsonData, {
      name: this.source,
      author: name && email ? `${name} ${email}` : '',
      version: '0.0.1'
    })

    await fs.writeJSONSync(pkgPath, jsonData, {spaces: '\t'})
    this.spinner.stop('package.json更新成功')
  }

  async initGit() {
    this.spinner.start('正在初始化git...')

    await runCmd(`cd ${this.repoMaps.target}`)

    // 改变进程执行位置到目标目录
    process.chdir(this.repoMaps.target)

    await runCmd('git init')

    this.spinner.stop('初始化git完成!')
  }

  async runApp() {
    try {
      this.spinner.start('正在安装项目依赖...')
      await runCmd('npm install --registry=https://registry.npm.taobao.org')
      await runCmd('git add . && git commit -m "init: 项目初始化完成"')
      this.spinner.succeed('依赖安装完成')

      console.log('启动项目：\n')
      log.success(`cd ${this.source}`)
      log.success(`npm run serve`)
    } catch (error) {
      console.log('依赖安装失败，请手动安装')
      log.success(`cd ${this.source}`)
      log.success(`npm install`)
    }
  }
}

module.exports = Creator;
