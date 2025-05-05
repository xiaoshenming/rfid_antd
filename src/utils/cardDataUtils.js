/**
 * 卡片数据处理工具
 * 用于解析和处理RFID卡数据
 */

/**
 * 解析卡数据
 * @param {string} data - 32位十六进制字符串数据
 * @returns {Object|null} - 解析后的卡数据对象或null（如果解析失败）
 */
export function parseCardData(data) {
  if (!data || data.length !== 32 || !/^[0-9A-F]{32}$/.test(data)) {
    console.error('数据格式错误: 必须是32位十六进制字符串');
    return null;
  }

  try {
    // 卡状态(1位): 1表示已注册，0表示未注册
    const isRegistered = data[0] === '1';
    
    // 挂失状态(1位): 0表示未挂失，1表示挂失
    const isLost = data[1] === '1';
    
    // 金额(4位十六进制): 范围0-9999
    const hexBalance = data.substring(2, 6);
    const balance = parseInt(hexBalance, 16);
    
    // 学号(12位)
    const studentId = data.substring(6, 18).replace(/0+$/, '');
    
    return {
      isRegistered,
      isLost,
      balance,
      studentId
    };
  } catch (error) {
    console.error('解析卡数据失败:', error);
    return null;
  }
}

/**
 * 构造卡数据
 * @param {Object} cardInfo - 卡信息对象
 * @param {boolean} cardInfo.isRegistered - 是否已注册
 * @param {boolean} cardInfo.isLost - 是否已挂失
 * @param {number} cardInfo.balance - 余额
 * @param {string} cardInfo.studentId - 学号
 * @returns {string|null} - 32位十六进制字符串数据或null（如果构造失败）
 */
export function buildCardData(cardInfo) {
  try {
    // 验证参数
    if (cardInfo.balance < 0 || cardInfo.balance > 9999) {
      console.error('余额超出范围(0-9999)');
      return null;
    }
    
    if (!cardInfo.studentId || !/^\d{1,12}$/.test(cardInfo.studentId)) {
      console.error('学号必须是12位以内数字');
      return null;
    }
    
    // 构造数据
    // 卡状态(1位): 1表示已注册，0表示未注册
    const registeredStatus = cardInfo.isRegistered ? '1' : '0';
    
    // 挂失状态(1位): 0表示未挂失，1表示挂失
    const lostStatus = cardInfo.isLost ? '1' : '0';
    
    // 金额(4位十六进制): 范围0-9999
    const hexBalance = cardInfo.balance.toString(16).toUpperCase().padStart(4, '0');
    
    // 学号(12位)
    const paddedStudentId = cardInfo.studentId.padStart(12, '0');
    
    // 剩余部分填充FF
    const padding = 'FF'.repeat(16 - (1 + 1 + 2 + 6));
    
    return registeredStatus + lostStatus + hexBalance + paddedStudentId + padding;
  } catch (error) {
    console.error('构造卡数据失败:', error);
    return null;
  }
}

/**
 * 保存操作记录到本地存储
 * @param {Object} operation - 操作记录对象
 * @param {string} operation.cardId - 卡ID
 * @param {string} operation.operationType - 操作类型（注册、充值、消费、挂失、注销）
 * @param {number} operation.amount - 金额（充值、消费时有效）
 * @param {string} operation.operationTime - 操作时间
 */
export function saveOperation(operation) {
  try {
    // 从本地存储获取现有操作记录
    const operationsJson = localStorage.getItem('cardOperations');
    const operations = operationsJson ? JSON.parse(operationsJson) : [];
    
    // 添加新操作记录
    operations.push(operation);
    
    // 保存回本地存储
    localStorage.setItem('cardOperations', JSON.stringify(operations));
  } catch (error) {
    console.error('保存操作记录失败:', error);
  }
}

/**
 * 获取所有操作记录
 * @returns {Array} - 操作记录数组
 */
export function getOperations() {
  try {
    const operationsJson = localStorage.getItem('cardOperations');
    return operationsJson ? JSON.parse(operationsJson) : [];
  } catch (error) {
    console.error('获取操作记录失败:', error);
    return [];
  }
}

/**
 * 清除所有操作记录
 */
export function clearOperations() {
  try {
    localStorage.removeItem('cardOperations');
  } catch (error) {
    console.error('清除操作记录失败:', error);
  }
}