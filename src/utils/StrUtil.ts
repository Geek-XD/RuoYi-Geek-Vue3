/**
 * 字符串工具类
 **/
export const StrUtil = {
  /**
   * 字符串是否为空白 空白的定义如下： <br>
   * 1、为null <br>
   * 2、为不可见字符（如空格）<br>
   * 3、""<br>
   *
   * @param str 被检测的字符串
   * @return boolean 是否为空
   */
  isBlank: function (str: string) {
    return str === undefined || str == null || this.trim(str) === "";

  },
  /**
   * 字符串是否为非空白 空白的定义如下： <br>
   * 1、不为null <br>
   * 2、不为不可见字符（如空格）<br>
   * 3、不为""<br>
   *
   * @param str 被检测的字符串
   * @return boolean 是否为非空
   */
  isNotBlank: function (str: string) {
    // == 代表相同,=== 代表严格相同
    return false === StrUtil.isBlank(str);
  },
  /**
   * 字符串是否为空，空的定义如下:<br>
   * 1、为null <br>
   * 2、为""<br>
   *
   * @param str 被检测的字符串
   * @return boolean 是否为空
   */
  isEmpty: function (str: string) {
    return str == null || str === "";

  },
  /**
   * 字符串是否为非空白 空白的定义如下： <br>
   * 1、不为null <br>
   * 2、不为""<br>
   *
   * @param str 被检测的字符串
   * @return boolean 是否为非空
   */
  isNotEmpty: function (str: string) {
    return !StrUtil.isEmpty(str);
  },
  /**
   * 空对象转字符串
   *
   * @param str 被检查的字符串
   * @return string 原字符串或者空串
   */
  nullToStr: function (str: string) {
    if (StrUtil.isEmpty(str)) {
      return "";
    }
    return str;
  },
  /**
   * 空格截取
   *
   * @param str 截取的字符串
   * @return string
   */
  trim: function (str: string) {
    if (str == null) {
      return "";
    }
    return str.toString().replace(/(^\s*)|(\s*$)|\r|\n/g, "");
  },
  /**
   * 比较两个字符串（大小写敏感）
   *
   * @param str 字符串
   * @param that 比较的字符串
   * @return boolean
   */
  equals: function (str: string, that: string) {
    return str === that;
  },
  /**
   * 比较两个字符串（大小写不敏感）
   *
   * @param str 字符串
   * @param that 比较的字符串
   * @return boolean
   */
  equalsIgnoreCase: function (str: string, that: string) {
    return String(str).toUpperCase() === String(that).toUpperCase();
  },
  /**
   * 将字符串按指定字符分割
   *
   * @param str 字符串
   * @param sep 比较的字符串
   * @param maxLen 最大长度
   * @return string[] 分割后的数组
   */
  split: function (str: string, sep: string, maxLen?: number) {
    if (StrUtil.isEmpty(str)) {
      return null;
    }
    const value = String(str).split(sep);
    return maxLen ? value.slice(0, maxLen - 1) : value;
  },
  /**
   * 字符串格式化(%s )
   *
   * @param str 字符串
   * @return 格式化后的字符串
   */
  sprintf: function (str: string) {
    let args = arguments, flag = true, i = 1;
    str = str.replace(/%s/g, function () {
      const arg = args[i++];
      if (typeof arg === 'undefined') {
        flag = false;
        return '';
      }
      return arg;
    });
    return flag ? str : '';
  },
  /**
   * 判断字符串是否是以start开头
   *
   * @param str 字符串
   * @param start 开始的字符串
   * @return boolean
   */
  startWith: function (str: string, start: string) {
    const reg = new RegExp("^" + start);
    return reg.test(str);
  },
  /**
   * 判断字符串是否是以end结尾
   *
   * @param str 字符串
   * @param end 结尾的字符串
   * @return boolean
   */
  endWith: function (str: string, end: string) {
    const reg = new RegExp(end + "$");
    return reg.test(str);
  },
  /**
   * 判断字符串是否包含指定的字符
   *
   * @param input 字符串
   * @param searchStr 搜索的字符串
   * @return boolean
   */
  contains: function (input: string, searchStr: string) {
    if (this.isEmpty(input) || this.isEmpty(searchStr)) {
      return false;
    }
    return input.indexOf(searchStr) !== -1;
  },
  /**
   * 检查字符串中是否包含空格
   * @param input 输入字符串
   * @returns boolean
   */
  containsWhitespace: function (input: string) {
    return this.contains(input, ' ');
  },
  /**
   * 生成指定个数的字符
   * @param ch 字符
   * @param repeatTimes 重复次数
   * @returns string
   */
  repeat: function (ch: string, repeatTimes: number) {
    let result = "";
    for (let i = 0; i < repeatTimes; i++) {
      result += ch;
    }
    return result;
  },
  /**
   * 删除字符串中的空格
   * @param input 输入字符串
   * @returns string
   */
  deleteWhitespace: function (input: string) {
    return input.replace(/\s+/g, '');
  },
  /**
   * 删除字符串中的空格
   * @param input 输入字符串
   * @returns string
   */
  rightPad: function (input: string, size: number, padStr: string) {
    return input + this.repeat(padStr, size);
  },
  /**
   * 在字符串左边填充指定字符，直到达到指定长度
   * @param input 输入字符串
   * @param size 目标长度
   * @param padStr 填充字符
   * @returns string
   */
  leftPad: function (input: string, size: number, padStr: string) {
    return this.repeat(padStr, size) + input;
  },
  /**
   * 首小写字母转大写
   * @param input 输入字符串
   * @returns string
   */
  capitalize: function (input: string) {
    let strLen = 0;
    if (input == null || (strLen = input.length) === 0) {
      return input;
    }
    return input.replace(/^[a-z]/, function (matchStr) {
      return matchStr.toLocaleUpperCase();
    });
  },
  /**
   * 首大写字母转小写
   * @param input 输入字符串
   * @returns string
   */
  uncapitalize: function (input: string) {
    let strLen = 0;
    if (input == null || (strLen = input.length) === 0) {
      return input;
    }
    return input.replace(/^[A-Z]/, function (matchStr) {
      return matchStr.toLocaleLowerCase();
    });
  },
  /**
   * 大写转小写，小写转大写
   * @param input 输入字符串
   * @returns string
   */
  swapCase: function (input: string) {
    return input.replace(/[a-z]/ig, function (matchStr) {
      if (matchStr >= 'A' && matchStr <= 'Z') {
        return matchStr.toLocaleLowerCase();
      } else if (matchStr >= 'a' && matchStr <= 'z') {
        return matchStr.toLocaleUpperCase();
      }
      return matchStr;
    });
  },
  /**
   * 下划线转驼峰法
   * @param input 输入字符串
   * @returns string
   */
  camelCase: function (input: string) {
    return input.replace(/_[a-z]/g, str1 => str1.substr(-1).toUpperCase());
  },
  /**
   * 标题命名法
   * @param input 输入字符串
   * @returns string
   */
  titleCase: function (input: string) {
    return input.replace(/( |^)[a-z]/g, L => L.toUpperCase());
  },
  /**
   * 统计含有的子字符串的个数
   * @param input 输入字符串
   * @param sub 子字符串
   * @returns number
   */
  countMatches: function (input: string, sub: string) {
    if (this.isEmpty(input) || this.isEmpty(sub)) {
      return 0;
    }
    let count = 0;
    let index = 0;
    while ((index = input.indexOf(sub, index)) !== -1) {
      index += sub.length;
      count++;
    }
    return count;
  },
  /**
   * 只包含字母
   * @param input 输入字符串
   * @returns boolean
   */
  isAlpha: function (input: string) {
    return /^[a-z]+$/i.test(input);
  },
  /**
   * 只包含字母、空格
   * @param input 输入字符串
   * @returns boolean
   */
  isAlphaSpace: function (input: string) {
    return /^[a-z\s]*$/i.test(input);
  },
  /**
   * 只包含字母、数字
   * @param input 输入字符串
   * @returns boolean
   */
  isAlphanumeric: function (input: string) {
    return /^[a-z0-9]+$/i.test(input);
  },
  /**
   * 只包含字母、数字和空格
   * @param input 输入字符串
   * @returns boolean
   */
  isAlphanumericSpace: function (input: string) {
    return /^[a-z0-9\s]*$/i.test(input);
  },
  /**
   * 只包含数字
   * @param input 输入字符串
   * @returns boolean
   */
  isNumeric: function (input: string) {
    return /^(?:[1-9]\d*|0)(?:\.\d+)?$/.test(input);
  },
  /**
   * 小数
   * @param input 输入字符串
   * @returns boolean
   */
  isDecimal: function (input: string) {
    return /^[-+]?(?:0|[1-9]\d*)\.\d+$/.test(input);
  },
  /**
   * 负小数
   * @param input 输入字符串
   * @returns boolean
   */
  isNegativeDecimal: function (input: string) {
    return /^\-?(?:0|[1-9]\d*)\.\d+$/.test(input);
  },
  /**
   * 正小数
   * @param input 输入字符串
   * @returns boolean
   */
  isPositiveDecimal: function (input: string) {
    return /^\+?(?:0|[1-9]\d*)\.\d+$/.test(input);
  },
  /**
   * 整数
   * @param input 输入字符串
   * @returns boolean
   */
  isInteger: function (input: string) {
    return /^[-+]?(?:0|[1-9]\d*)$/.test(input);
  },
  /**
   * 正整数
   * @param input 输入字符串
   * @returns boolean
   */
  isPositiveInteger: function (input: string) {
    return /^\+?(?:0|[1-9]\d*)$/.test(input);
  },
  /**
   * 负整数
   * @param input 输入字符串
   * @returns boolean
   */
  isNegativeInteger: function (input: string) {
    return /^\-?(?:0|[1-9]\d*)$/.test(input);
  },
  /**
   * 只包含数字和空格
   * @param input 输入字符串
   * @returns boolean
   */
  isNumericSpace: function (input: string) {
    return /^[\d\s]*$/.test(input);
  },
  /**
   * 只包含空白
   * @param input 输入字符串
   * @returns boolean
   */
  isWhitespace: function (input: string) {
    return /^\s*$/.test(input);
  },
  // 是否全是小写字母
  isAllLowerCase: function (input: string) {
    return /^[a-z]+$/.test(input);
  },
  /**
   * 是否全是大写字母
   * @param input 输入字符串
   * @returns boolean
   */
  isAllUpperCase: function (input: string) {
    return /^[A-Z]+$/.test(input);
  },
  /**
   * 默认字符串
   * @param input 输入字符串
   * @param defaultStr 默认字符串
   * @returns string
   */
  defaultString: function (input: string, defaultStr: string) {
    return input == null ? defaultStr : input;
  },
  /**
   * 如果为空白，默认字符串
   * @param input 输入字符串
   * @param defaultStr 默认字符串
   * @returns string
   */
  defaultIfBlank: function (input: string, defaultStr: string) {
    return this.isBlank(input) ? defaultStr : input;
  },
  /**
   * 如果为空，默认字符串
   * @param input 输入字符串
   * @param defaultStr 默认字符串
   * @returns string
   */
  defaultIfEmpty: function (input: string, defaultStr: string) {
    return this.isEmpty(input) ? defaultStr : input;
  },
  /**
   * 字符串反转
   * @param input 输入字符串
   * @returns string
   */
  reverse: function (input: string) {
    if (this.isBlank(input)) {
      input;
    }
    return input.split("").reverse().join("");
  },
  /**
   * 删掉特殊字符(英文状态下)
   * @param input 输入字符串
   * @returns string
   */
  removeSpecialCharacter: function (input: string) {
    return input.replace(/[!-/:-@\[-`{-~]/g, "");
  },
  /**
   * 只包含特殊字符、数字和字母（不包括空格，若想包括空格，改为[ -~]）
   * @param input 输入字符串
   * @returns boolean
   */
  isSpecialCharacterAlphanumeric: function (input: string) {
    return /^[!-~]+$/.test(input);
  },
  /**
   * 校验时排除某些字符串，即不能包含某些字符串
   * @param {Object} conditions:里面有多个属性，如下：
   *
   * @param {String} matcherFlag 匹配标识
   * 0:数字；1：字母；2：小写字母；3:大写字母；4：特殊字符,指英文状态下的标点符号及括号等；5:中文;
   * 6:数字和字母；7：数字和小写字母；8：数字和大写字母；9：数字、字母和特殊字符；10：数字和中文；
   * 11：小写字母和特殊字符；12：大写字母和特殊字符；13：字母和特殊字符；14：小写字母和中文；15：大写字母和中文；
   * 16：字母和中文；17：特殊字符、和中文；18：特殊字符、字母和中文；19：特殊字符、小写字母和中文；20：特殊字符、大写字母和中文；
   * 100：所有字符;
   * @param {Array} excludeStrArr 排除的字符串，数组格式
   * @param {String} length 长度，可为空。1,2表示长度1到2之间；10，表示10个以上字符；5表示长度为5
   * @param {Boolean} ignoreCase 是否忽略大小写
   * conditions={matcherFlag:"0",excludeStrArr:[],length:"",ignoreCase:true}
   */
  isPatternMustExcludeSomeStr: function (input: string, conditions: any) {
    //参数
    const matcherFlag = conditions.matcherFlag;
    const excludeStrArr = conditions.excludeStrArr;
    const length = conditions.length;
    const ignoreCase = conditions.ignoreCase;
    //拼正则
    const size = excludeStrArr.length;
    let regex = (size === 0) ? "^" : "^(?!.*(?:{0}))";
    let subPattern = "";
    for (let i = 0; i < size; i++) {
      excludeStrArr[i] = this.escapeMetacharacterOfStr(excludeStrArr[i]);
      subPattern += excludeStrArr[i];
      if (i !== size - 1) {
        subPattern += "|";
      }
    }
    regex = this.format(regex, [subPattern]);
    switch (matcherFlag) {
      case '0':
        regex += "\\d";
        break;
      case '1':
        regex += "[a-zA-Z]";
        break;
      case '2':
        regex += "[a-z]";
        break;
      case '3':
        regex += "[A-Z]";
        break;
      case '4':
        regex += "[!-/:-@\[-`{-~]";
        break;
      case '5':
        regex += "[\u4E00-\u9FA5]";
        break;
      case '6':
        regex += "[a-zA-Z0-9]";
        break;
      case '7':
        regex += "[a-z0-9]";
        break;
      case '8':
        regex += "[A-Z0-9]";
        break;
      case '9':
        regex += "[!-~]";
        break;
      case '10':
        regex += "[0-9\u4E00-\u9FA5]";
        break;
      case '11':
        regex += "[a-z!-/:-@\[-`{-~]";
        break;
      case '12':
        regex += "[A-Z!-/:-@\[-`{-~]";
        break;
      case '13':
        regex += "[a-zA-Z!-/:-@\[-`{-~]";
        break;
      case '14':
        regex += "[a-z\u4E00-\u9FA5]";
        break;
      case '15':
        regex += "[A-Z\u4E00-\u9FA5]";
        break;
      case '16':
        regex += "[a-zA-Z\u4E00-\u9FA5]";
        break;
      case '17':
        regex += "[\u4E00-\u9FA5!-/:-@\[-`{-~]";
        break;
      case '18':
        regex += "[\u4E00-\u9FA5!-~]";
        break;
      case '19':
        regex += "[a-z\u4E00-\u9FA5!-/:-@\[-`{-~]";
        break;
      case '20':
        regex += "[A-Z\u4E00-\u9FA5!-/:-@\[-`{-~]";
        break;
      case '100':
        regex += "[\s\S]";
        break;
      default:
        alert(matcherFlag + ":This type is not supported!");
    }
    regex += this.isNotBlank(length) ? "{" + length + "}" : "+";
    regex += "$";
    const pattern = new RegExp(regex, ignoreCase ? "i" : "");
    return pattern.test(input);
  },
  /**
   * @param {String} message
   * @param {Array} arr
   * 消息格式化
   */
  format: function (message: string, arr: Array<string>) {
    return message.replace(/{(\d+)}/g, function (matchStr, group1) {
      return arr[group1];
    });
  },
  /**
   * 把连续出现多次的字母字符串进行压缩。如输入:aaabbbbcccccd 输出:3a4b5cd
   * @param {String} input
   * @param {Boolean} ignoreCase : true or false
   */
  compressRepeatedStr: function (input: string, ignoreCase: boolean) {
    const pattern = new RegExp("([a-z])\\1+", ignoreCase ? "ig" : "g");
    return input.replace(pattern, function (matchStr, group1) {
      return matchStr.length + group1;
    });
  },
  /**
   * 校验必须同时包含某些字符串
   * @param {String} input
   * @param {Object} conditions:里面有多个属性，如下：
   *
   * @param {String} matcherFlag 匹配标识
   * 0:数字；1：字母；2：小写字母；3:大写字母；4：特殊字符,指英文状态下的标点符号及括号等；5:中文;
   * 6:数字和字母；7：数字和小写字母；8：数字和大写字母；9：数字、字母和特殊字符；10：数字和中文；
   * 11：小写字母和特殊字符；12：大写字母和特殊字符；13：字母和特殊字符；14：小写字母和中文；15：大写字母和中文；
   * 16：字母和中文；17：特殊字符、和中文；18：特殊字符、字母和中文；19：特殊字符、小写字母和中文；20：特殊字符、大写字母和中文；
   * 100：所有字符;
   * @param {Array} excludeStrArr 排除的字符串，数组格式
   * @param {String} length 长度，可为空。1,2表示长度1到2之间；10，表示10个以上字符；5表示长度为5
   * @param {Boolean} ignoreCase 是否忽略大小写
   * conditions={matcherFlag:"0",containStrArr:[],length:"",ignoreCase:true}
   *
   */
  isPatternMustContainSomeStr: function (input: string, conditions: {
    matcherFlag: string,
    containStrArr: Array<string>,
    length: string,
    ignoreCase: boolean
  }) {
    //参数
    const matcherFlag = conditions.matcherFlag;
    const containStrArr = conditions.containStrArr;
    const length = conditions.length;
    const ignoreCase = conditions.ignoreCase;
    //创建正则
    const size = containStrArr.length;
    let regex = "^";
    let subPattern = "";
    for (let i = 0; i < size; i++) {
      containStrArr[i] = this.escapeMetacharacterOfStr(containStrArr[i]);
      subPattern += "(?=.*" + containStrArr[i] + ")";
    }
    regex += subPattern;
    switch (matcherFlag) {
      case '0':
        regex += "\\d";
        break;
      case '1':
        regex += "[a-zA-Z]";
        break;
      case '2':
        regex += "[a-z]";
        break;
      case '3':
        regex += "[A-Z]";
        break;
      case '4':
        regex += "[!-/:-@\[-`{-~]";
        break;
      case '5':
        regex += "[\u4E00-\u9FA5]";
        break;
      case '6':
        regex += "[a-zA-Z0-9]";
        break;
      case '7':
        regex += "[a-z0-9]";
        break;
      case '8':
        regex += "[A-Z0-9]";
        break;
      case '9':
        regex += "[!-~]";
        break;
      case '10':
        regex += "[0-9\u4E00-\u9FA5]";
        break;
      case '11':
        regex += "[a-z!-/:-@\[-`{-~]";
        break;
      case '12':
        regex += "[A-Z!-/:-@\[-`{-~]";
        break;
      case '13':
        regex += "[a-zA-Z!-/:-@\[-`{-~]";
        break;
      case '14':
        regex += "[a-z\u4E00-\u9FA5]";
        break;
      case '15':
        regex += "[A-Z\u4E00-\u9FA5]";
        break;
      case '16':
        regex += "[a-zA-Z\u4E00-\u9FA5]";
        break;
      case '17':
        regex += "[\u4E00-\u9FA5!-/:-@\[-`{-~]";
        break;
      case '18':
        regex += "[\u4E00-\u9FA5!-~]";
        break;
      case '19':
        regex += "[a-z\u4E00-\u9FA5!-/:-@\[-`{-~]";
        break;
      case '20':
        regex += "[A-Z\u4E00-\u9FA5!-/:-@\[-`{-~]";
        break;
      case '100':
        regex += "[\s\S]";
        break;
      default:
        alert(matcherFlag + ":This type is not supported!");
    }
    regex += this.isNotBlank(length) ? "{" + length + "}" : "+";
    regex += "$";
    const pattern = new RegExp(regex, ignoreCase ? "i" : "");
    return pattern.test(input);
  },
  /**
   * 中文校验
   * @param input 输入字符串
   * @returns boolean
   */
  isChinese: function (input: string) {
    return /^[\u4E00-\u9FA5]+$/.test(input);
  },
  /**
   * 去掉中文字符
   * @param input 输入字符串
   * @returns string
   */
  removeChinese: function (input: string) {
    return input.replace(/[\u4E00-\u9FA5]+/gm, "");
  },
  /**
   * 转义元字符
   * @param input 输入字符串
   * @returns string
   */
  escapeMetacharacter: function (input: string) {
    const metacharacter = "^$()*+.[]|\\-?{}|";
    if (metacharacter.indexOf(input) >= 0) {
      input = "\\" + input;
    }
    return input;
  },
  /**
   * 转义字符串中的元字符
   * @param input 输入字符串
   * @returns string
   */
  escapeMetacharacterOfStr: function (input: string) {
    return input.replace(/[\^\$\*\+\.\|\\\-\?\{\}\|]/gm, "\\$&");
  }
};
