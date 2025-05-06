/**
 * 串口通信工具模块
 * 使用Web Serial API实现浏览器与串口设备的通信
 */

class SerialCommunication {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.readableStreamClosed = null;
    this.writableStreamClosed = null;
    this.keepReading = true;
  }

  /**
   * 请求串口访问权限并打开串口
   * @param {Object} options - 串口参数对象
   * @param {number} options.baudRate - 波特率，默认115200
   * @param {string} options.parity - 校验位，默认'none'
   * @param {number} options.dataBits - 数据位，默认8
   * @param {number} options.stopBits - 停止位，默认1
   * @returns {Promise<boolean>} - 是否成功打开串口
   */
  async openPort({ baudRate = 115200, parity = 'none', dataBits = 8, stopBits = 1 } = {}) {
    if (this.port && this.port.readable && this.port.writable) {
      console.warn('串口已处于打开状态，不能重复打开');
      return false;
    }
    try {
      // 请求串口访问权限
      this.port = await navigator.serial.requestPort();
      // 打开串口连接，支持更多参数
      await this.port.open({ baudRate, parity, dataBits, stopBits });
      // 创建读取器和写入器
      this.setupReader();
      this.setupWriter();
      return true;
    } catch (error) {
      console.error('打开串口失败:', error);
      return false;
    }
  }

  /**
   * 设置串口读取器
   */
  setupReader() {
    if (!this.port || !this.port.readable) return;
    
    // 创建显式读取器
    this.reader = this.port.readable.getReader();
    let textDecoder;
    
    try {
      textDecoder = new TextDecoder('gb18030');
    } catch (e) {
      textDecoder = new TextDecoder();
    }
  
    const readChunk = async () => {
      while (this.keepReading) {
        try {
          const { value, done } = await this.reader.read();
          if (done) break;
          
          const data = textDecoder.decode(value);
          this.onDataReceived(data);
        } catch (error) {
          console.error('读取数据时出错:', error);
          break;
        }
      }
      await this.reader.releaseLock();
      console.log('显式读取器已释放');
    };
    
    readChunk();
  } 

  /**
   * 事件处理相关
   */
  // 事件监听器存储
  _eventListeners = {
    'data-received': []
  };

  /**
   * 添加事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  addEventListener(eventName, callback) {
    if (!this._eventListeners[eventName]) {
      this._eventListeners[eventName] = [];
    }
    this._eventListeners[eventName].push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  removeEventListener(eventName, callback) {
    if (!this._eventListeners[eventName]) return;

    const index = this._eventListeners[eventName].indexOf(callback);
    if (index !== -1) {
      this._eventListeners[eventName].splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   */
  dispatchEvent(eventName, data) {
    if (!this._eventListeners[eventName]) return;

    for (const callback of this._eventListeners[eventName]) {
      callback(data);
    }
  }

  /**
   * 设置串口写入器
   */
  setupWriter() {
    if (!this.port || !this.port.writable) return;

    this.writer = this.port.writable.getWriter();
  }

  /**
   * 发送数据到串口
   * @param {string} data - 要发送的数据
   * @param {string} encoding - 编码，默认'gb18030'
   * @returns {Promise<boolean>} - 是否成功发送数据
   */
  async sendData(data, encoding = 'gb18030') {
    if (!this.writer) return false;
    try {
      if (!data.endsWith('\n')) {
        data += '\n';
      }
      let dataArrayBuffer;
      try {
        const encoder = new TextEncoder(encoding);
        dataArrayBuffer = encoder.encode(data);
      } catch (e) {
        // 浏览器不支持gb18030编码时降级
        const encoder = new TextEncoder();
        dataArrayBuffer = encoder.encode(data);
      }
      await this.writer.write(dataArrayBuffer);
      return true;
    } catch (error) {
      console.error('发送数据失败:', error);
      return false;
    }
  }

  /**
   * 关闭串口连接
   */
  async closePort() {
    this.keepReading = false;
    console.log('开始关闭串口...');
  
    try {
      // 1. 处理写入器
      if (this.writer) {
        await this.writer.close().catch(e => console.error('写入器关闭失败:', e));
        await new Promise(resolve => setTimeout(resolve, 50)); // 等待关闭完成
        if (this.writer && this.writer.releaseLock) {
          this.writer.releaseLock();
        }
        this.writer = null;
        console.log('写入器已关闭');
      }
  
      // 2. 处理读取器
      if (this.reader) {
        await this.reader.cancel().catch(e => console.error('读取器取消失败:', e));
        if (this.reader.releaseLock) {
          await this.reader.releaseLock();
        }
        this.reader = null;
        console.log('显式读取器已释放');
      }
  
      // 3. 处理端口
      if (this.port) {
        // 强制关闭流
        if (this.port.readable && this.port.readable.locked) {
          const tempReader = this.port.readable.getReader();
          await tempReader.cancel();
          await tempReader.releaseLock();
          console.log('强制释放读取流');
        }
        
        if (this.port.writable && this.port.writable.locked) {
          const tempWriter = this.port.writable.getWriter();
          await tempWriter.close();
          await tempWriter.releaseLock();
          console.log('强制释放写入流');
        }
  
        await this.port.close();
        this.port = null;
        console.log('串口已成功关闭');
      }
  
    } catch (error) {
      console.error('关闭串口时发生严重错误:', error);
      throw error;
    }
  }

  /**
   * 数据接收处理
   * @param {string} data - 接收到的数据
   */
  onDataReceived(data) {
    console.log('接收到数据:', data);
    // 触发data-received事件，通知监听器
    this.dispatchEvent('data-received', data);
  }

  /**
   * 读取卡ID
   * @returns {Promise<string|null>} - 卡ID或null（如果读取失败）
   */
  async readCardId() {
    if (!this.port || !this.writer) return null;

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 200;
    let retryCount = 0;
    let buffer = '';

    while (retryCount < MAX_RETRIES) {
      try {
        // 发送RID命令读取卡ID
        await this.sendData('RID');

        // 等待响应
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (retryCount < MAX_RETRIES - 1) {
              retryCount++;
              setTimeout(() => resolve(this.readCardId()), RETRY_DELAY);
            } else {
              resolve(null);
            }
          }, 1000);

          // 设置数据接收回调
          const originalCallback = this.onDataReceived;
          this.onDataReceived = (data) => {
            buffer += data;

            // 检查数据完整性
            if (buffer.includes('Id:') || buffer.length >= 10) {
              this.onDataReceived = originalCallback;
              clearTimeout(timeout);

              // 处理接收到的数据
              const cardId = buffer.trim();
              buffer = '';

              if (cardId) {
                resolve(cardId);
              } else {
                resolve(null);
              }
            }
          };
        });
      } catch (error) {
        console.error(`读取卡ID失败(尝试${retryCount + 1}/${MAX_RETRIES}):`, error);
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          retryCount++;
        } else {
          return null;
        }
      }
    }
  }

  /**
   * 读取卡数据块
   * @param {string} [cardId] - 可选参数，已读取的卡ID
   * @returns {Promise<string|null>} - 卡数据或null（如果读取失败）
   */
  async readCardData(cardId) {
    if (!this.port || !this.writer) return null;

    try {
      // 发送RBK命令读取块数据
      await this.sendData('RBK');

      // 等待响应
      return new Promise((resolve) => {
        // 设置超时
        const timeout = setTimeout(() => {
          resolve(null);
        }, 10000);

        // 接收到的数据缓冲
        let dataBuffer = '';
        let isComplete = false;
        let lastDataTime = Date.now();

        // 设置一次性数据接收回调
        const originalCallback = this.onDataReceived;
        this.onDataReceived = (data) => {
          if (isComplete) return;

          dataBuffer += data;
          console.log('接收数据块:', data);
          lastDataTime = Date.now();

          // 检查数据是否完整
          const checkComplete = () => {
            // 检查是否接收到完整的数据块
            if (dataBuffer.includes('B1:1,D:')) {
              const match = dataBuffer.match(/B1:1,D:([0-9A-F]{32})/);
              if (match && match[1]) {
                isComplete = true;
                this.onDataReceived = originalCallback;
                clearTimeout(timeout);
                resolve(match[1]);
                return true;
              }
            } else if (dataBuffer.includes('B1:0,C:')) {
              // 读取失败
              isComplete = true;
              this.onDataReceived = originalCallback;
              clearTimeout(timeout);
              resolve(null);
              return true;
            }

            // 检查是否超过500ms没有新数据
            if (Date.now() - lastDataTime > 500) {
              if (dataBuffer.length > 0) {
                console.warn('数据接收超时，已接收:', dataBuffer);
              }
              isComplete = true;
              this.onDataReceived = originalCallback;
              clearTimeout(timeout);
              resolve(null);
              return true;
            }
            return false;
          };

          // 立即检查数据完整性
          if (!checkComplete()) {
            // 设置延迟检查，确保所有数据块都已接收
            setTimeout(() => {
              if (!isComplete) checkComplete();
            }, 100);
          }
        };
    });
    }catch (error) {
      console.error('读取卡数据失败:', error);
      return null;
    }
  }

  /**
   * 写入卡数据块
   * @param {string} data - 要写入的数据（32位ASCII十六进制字符串）
   * @returns {Promise<boolean>} - 是否成功写入数据
   */
  async writeCardData(data) {
    if (!this.port || !this.writer) return false;

    // 验证数据格式
    if (data.length !== 32 || !/^[0-9A-F]{32}$/.test(data)) {
      console.error('数据格式错误: 必须是32位十六进制字符串');
      return false;
    }

    try {
      // 发送WBK命令写入数据
      await this.sendData(`WBK${data}`);

      // 等待响应
      return new Promise((resolve) => {
        // 设置超时
        const timeout = setTimeout(() => {
          resolve(false);
        }, 10000);

        // 接收到的数据缓冲
        let dataBuffer = '';

        // 设置一次性数据接收回调
        const originalCallback = this.onDataReceived;
        this.onDataReceived = (data) => {
          dataBuffer += data;

          // 检查写入是否成功
          if (dataBuffer.includes('WB1:1,C:0') && dataBuffer.includes('写入完成')) {
            // 恢复原始回调
            this.onDataReceived = originalCallback;
            clearTimeout(timeout);
            resolve(true);
          } else if (dataBuffer.includes('WB1:1,C:') ||
                     dataBuffer.includes('写入命令格式错误') ||
                     dataBuffer.includes('未知命令')) {
            // 写入失败
            this.onDataReceived = originalCallback;
            clearTimeout(timeout);
            resolve(false);
          }
        };
      });
    } catch (error) {
      console.error('写入卡数据失败:', error);
      return false;
    }
  }


  /**
   * 获取可用串口列表
   * @returns {Promise<Array>} - 可用串口列表
   */
  static async getAvailablePorts() {
    try {
      // 注意：Web Serial API不提供列出所有可用串口的方法
      // 用户必须通过navigator.serial.requestPort()手动选择串口
      return [];
    } catch (error) {
      console.error('获取可用串口列表失败:', error);
      return [];
    }
  }
}

export default SerialCommunication;
