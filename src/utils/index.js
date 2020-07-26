const chalk = require('chalk');
const fs = require('fs-extra');
const childProcess = require('child_process');
const path = require('path');

const isFunction = (fn) => typeof fn === 'function';
exports.isFunction = isFunction;

exports.parseCmdParams = (cmd) => {
  if (!cmd) return {};
  const resOps = {};
  cmd.options.forEach((option) => {
    const key = option.long.replace(/^--/, '');
    if (cmd[key] && !isFunction(cmd[key])) {
      resOps[key] = cmd[key];
    }
  });
  return resOps;
};

exports.log = {
  warning(msg = '') {
    console.warn(chalk.yellow(msg));
  },
  error(msg = '') {
    console.error(chalk.red(msg));
  },
  success(msg = '') {
    console.log(chalk.green(msg));
  },
};

exports.copyFiles = async (tempPath, targetPath, exlcudes = []) => {
  const removeFiles = ['./git', './changelogs'];
  await fs.copySync(tempPath, targetPath);

  if (exlcudes && exlcudes.length) {
    await Promise.all(
      exlcudes.map((file) => async () => {
        await fs.removeSync(path.resolve(targetPath, file));
      })
    );
  }
};

const runCmd = (cmd) => {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, (err, ...args) => {
      if (err) return reject(err);
      return resolve(...args);
    });
  });
};

exports.runCmd = runCmd;

exports.getGitUser = () => {
  return new Promise(async (resolve, reject) => {
    const user = {};
    try {
      const [name] = await runCmd('git config user.name');
      const [email] = await runCmd('git config user.email');
      name && (user.name = name.replace(/\n/g, ''));
      email && (user.email = email.replace(/\n/g, ''));
    } catch (error) {
      reject(error);
    } finally {
      resolve(user);
    }
  });
};
