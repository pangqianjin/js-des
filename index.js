const {encodeFile, decodeFile} = require('./utils')

// 加密文本文件
const leftTrimLength = encodeFile('./utils.js', './utils.js.bk', 'utf-8')
decodeFile('./utils.js.bk', './utils.js.bk.bk', leftTrimLength, 'utf-8')

// 加密图像文件
const leftTrimLength = encodeFile('./default_avatar.png', './default_avatar.bk.png', 'base64')
decodeFile('./default_avatar.bk.png', './default_avatar.bk.bk.png', leftTrimLength, 'base64')