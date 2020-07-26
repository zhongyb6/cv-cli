exports.InquireConfig = {
  folderExist: [
    {
      type: 'list',
      name: 'recover',
      message: '当前文件夹已经存在，请选择操作：',
      choices: [
        { name: '创建一个新的文件夹', value: 'newFolder' },
        { name: '覆盖', value: 'cover' },
        { name: '退出', value: 'exit' },
      ],
    },
  ],
  rename: [
    {
      name: 'inputNewName',
      type: 'input',
      message: '请输入新的项目名称：',
    },
  ],
};

exports.RepoPath = 'github:liguirong720/cv-cli-template';
