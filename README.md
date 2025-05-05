import tkinter as tk
from tkinter import messagebox, ttk
import serial
import serial.tools.list_ports
import time
from datetime import datetime

class CardSystem:
    def __init__(self, root):
        self.root = root
        self.root.title("饭卡充值消费系统")
        self.root.geometry("800x600")
        
        # 操作记录列表
        self.operations = []
        
        # 串口相关变量
        self.serial_port = None
        self.serial_ports = []
        
        # 显示登录界面
        self.show_login()

    def read_card(self):
        """读取卡号"""
        if not self.serial_port or not self.serial_port.is_open:
            messagebox.showerror("错误", "请先打开串口")
            return None
            
        try:
            # 清空串口缓冲区
            self.serial_port.reset_input_buffer()
            
            # 发送RID命令读取卡ID(必须包含\n)
            self.serial_port.write(b'RID\n')
            
            # 设置超时时间(5秒)
            start_time = time.time()
            while time.time() - start_time < 5:
                if self.serial_port.in_waiting > 0:
                    # 读取卡号(以换行符结尾)
                    card_id = self.serial_port.readline().decode('utf-8').strip()
                    if card_id:  # 非空卡号
                        return card_id
                time.sleep(0.1)
                
            messagebox.showerror("错误", "读卡超时")
            return None
            
        except Exception as e:
            messagebox.showerror("错误", f"读卡失败: {str(e)}")
            return None

    def read_card_data(self):
        """读取卡数据块"""
        if not self.serial_port or not self.serial_port.is_open:
            messagebox.showerror("错误", "请先打开串口")
            return None
            
        try:
            # 清空串口缓冲区
            self.serial_port.reset_input_buffer()
            
            # 发送RBK命令读取块数据(必须包含\n)
            self.serial_port.write(b'RBK\n')
            
            # 设置超时时间(5秒)
            start_time = time.time()
            while time.time() - start_time < 10:
                if self.serial_port.in_waiting > 0:
                    # 读取一行数据(以换行符结尾)
                    line = self.serial_port.readline().decode('utf-8').strip()
                    if line:  # 非空数据
                        # 跳过状态行(CD,AC,CS,AKA)，寻找RB1:1,D:开头的行
                        if line.startswith('RB1:1,D:'):
                            return line[8:]  # 返回数据部分
                        elif line.startswith('RB1:0,C:'):
                            messagebox.showerror("错误", f"读取块数据失败，状态码: {line[8:]}")
                            return None
                time.sleep(0.1)
                
            messagebox.showerror("错误", "读取数据超时")
            return None
            
        except Exception as e:
            messagebox.showerror("错误", f"读取数据失败: {str(e)}")
            return None

    def write_card_data(self, data):
        """写入卡数据块"""
        if not self.serial_port or not self.serial_port.is_open:
            messagebox.showerror("错误", "请先打开串口")
            return False
            
        try:
            # 清空串口缓冲区
            self.serial_port.reset_input_buffer()
            
            # 发送WBK命令写入数据(必须包含\n)
            # 确保数据是32位ASCII十六进制字符串
            if len(data) != 32 or not all(c in '0123456789ABCDEF' for c in data):
                messagebox.showerror("错误", "数据格式错误: 必须是32位十六进制字符串")
                return False
            self.serial_port.write(f'WBK{data}\n'.encode('utf-8'))
            
            # 设置超时时间(5秒)
            start_time = time.time()
            while time.time() - start_time < 10:
                if self.serial_port.in_waiting > 0:
                    # 读取一行响应
                    line = self.serial_port.readline().decode('utf-8').strip()
                    if line:  # 非空数据
                        # 跳过状态行(CD,AC,CS,AKA)，寻找WB1:1,C:开头的行
                        if line.startswith('WB1:1,C:0'):
                            # 等待写入完成响应
                            line = self.serial_port.readline().decode('utf-8').strip()
                            if line == "写入完成":
                                return True
                        elif line.startswith('WB1:1,C:'):
                            messagebox.showerror("错误", f"写入失败，状态码: {line[8:]}")
                            return False
                        elif line == "写入命令格式错误":
                            messagebox.showerror("错误", "写入命令格式错误")
                            return False
                        elif line == "未知命令":
                            messagebox.showerror("错误", "未知命令")
                            return False
                time.sleep(0.1)
                
            messagebox.showerror("错误", "写入数据超时")
            return False
            
        except Exception as e:
            messagebox.showerror("错误", f"写入数据失败: {str(e)}")
            return False

    def show_login(self):
        """显示登录界面"""
        self.clear_window()
        
        tk.Label(self.root, text="饭卡管理系统", font=("Arial", 20)).pack(pady=20)
        
        tk.Label(self.root, text="账号:").pack()
        self.username_entry = tk.Entry(self.root)
        self.username_entry.pack()
        self.username_entry.insert(0, "farsight")
        
        tk.Label(self.root, text="密码:").pack()
        self.password_entry = tk.Entry(self.root, show="*")
        self.password_entry.pack()
        self.password_entry.insert(0, "123")
        
        tk.Button(self.root, text="登录", command=self.check_login).pack(pady=20)

    def check_login(self):
        """检查登录信息"""
        username = self.username_entry.get()
        password = self.password_entry.get()
        
        if username == "farsight" and password == "123":
            self.show_main()
        else:
            messagebox.showerror("错误", "账号或密码错误")

    def show_main(self):
        """显示主界面"""
        self.clear_window()
        
        # 串口选择
        tk.Label(self.root, text="选择串口:").pack()
        self.port_combobox = ttk.Combobox(self.root)
        self.port_combobox.pack()
        
        self.refresh_ports()
        
        tk.Button(self.root, text="打开串口", command=self.open_port).pack(pady=10)
        
        # 功能按钮
        tk.Button(self.root, text="注册", command=self.show_register).pack(fill=tk.X, padx=50, pady=5)
        tk.Button(self.root, text="充值", command=self.show_recharge).pack(fill=tk.X, padx=50, pady=5)
        tk.Button(self.root, text="消费", command=self.show_consume).pack(fill=tk.X, padx=50, pady=5)
        tk.Button(self.root, text="挂失", command=self.show_lost).pack(fill=tk.X, padx=50, pady=5)
        tk.Button(self.root, text="注销", command=self.show_cancel).pack(fill=tk.X, padx=50, pady=5)
        tk.Button(self.root, text="操作记录", command=self.show_records).pack(fill=tk.X, padx=50, pady=5)
        
    def refresh_ports(self):
        """刷新可用串口列表"""
        self.serial_ports = [port.device for port in serial.tools.list_ports.comports()]
        self.port_combobox['values'] = self.serial_ports
        if self.serial_ports:
            self.port_combobox.current(0)

    def open_port(self):
        """打开选择的串口"""
        port = self.port_combobox.get()
        if not port:
            messagebox.showerror("错误", "请选择串口")
            return
            
        try:
            if self.serial_port and self.serial_port.is_open:
                self.serial_port.close()
                
            self.serial_port = serial.Serial(port, 115200, timeout=1)
            messagebox.showinfo("成功", f"已打开串口 {port}")
        except Exception as e:
            messagebox.showerror("错误", f"打开串口失败: {str(e)}")

    def clear_window(self):
        """清除当前窗口内容"""
        for widget in self.root.winfo_children():
            widget.destroy()

    def show_register(self):
        """显示注册界面"""
        self.clear_window()
        
        tk.Button(self.root, text="返回", command=self.show_main).pack(anchor="nw", padx=10, pady=10)
        
        tk.Label(self.root, text="饭卡注册", font=("Arial", 16)).pack(pady=10)
        
        # 卡号显示
        tk.Label(self.root, text="卡号:").pack()
        self.card_id_entry = tk.Entry(self.root, state='readonly')
        self.card_id_entry.pack()
        
        tk.Button(self.root, text="读卡", command=self.read_card_for_register).pack(pady=5)
        
        # 学号输入
        tk.Label(self.root, text="学号:").pack()
        self.student_id_entry = tk.Entry(self.root)
        self.student_id_entry.pack()
        
        # 金额输入
        tk.Label(self.root, text="金额:").pack()
        self.balance_entry = tk.Entry(self.root)
        self.balance_entry.pack()
        self.balance_entry.insert(0, "200")
        
        tk.Button(self.root, text="注册", command=self.do_register).pack(pady=20)
        
    def read_card_for_register(self):
        """为注册读取卡号"""
        card_id = self.read_card()
        if card_id:
            self.card_id_entry.config(state='normal')
            self.card_id_entry.delete(0, tk.END)
            self.card_id_entry.insert(0, card_id)
            self.card_id_entry.config(state='readonly')
            
    def do_register(self):
        """执行注册操作"""
        card_id = self.card_id_entry.get()
        student_id = self.student_id_entry.get()
        balance = self.balance_entry.get()
        
        if not card_id:
            messagebox.showerror("错误", "请先读卡")
            return
            
        if not student_id:
            messagebox.showerror("错误", "请输入学号")
            return
            
        try:
            balance = float(balance)
            if balance <= 0:
                messagebox.showerror("错误", "金额必须大于0")
                return
        except ValueError:
            messagebox.showerror("错误", "请输入有效的金额")
            return
            
        try:
            # 构造写入数据(严格遵循32位十六进制ASCII格式)
            # 卡状态:1(已注册), 挂失状态:0(未挂失)
            # 金额转为4位十六进制字符串(范围0-9999)
            if balance > 9999 or balance < 0:
                messagebox.showerror("错误", "金额超出范围(0-9999)")
                return
            hex_balance = f"{int(balance):04X}"
            # 学号补足12位数字
            if not student_id.isdigit() or len(student_id) > 12:
                messagebox.showerror("错误", "学号必须是12位以内数字")
                return
            padded_student_id = student_id.zfill(12)[:12]
            # 剩余部分填充FF
            data = f"10{hex_balance}{padded_student_id}" + "FF" * (16 - (1 + 1 + 2 + 6))
            
            # 写入卡数据
            if not self.write_card_data(data):
                return
                
            # 记录操作
            self.operations.append({
                'card_id': card_id,
                'operation_type': "注册",
                'amount': balance,
                'operation_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            messagebox.showinfo("成功", "注册成功")
            self.show_main()
        except Exception as e:
            messagebox.showerror("错误", f"注册失败: {str(e)}")
        
    def show_recharge(self):
        """显示充值界面"""
        self.clear_window()
        
        tk.Button(self.root, text="返回", command=self.show_main).pack(anchor="nw", padx=10, pady=10)
        
        tk.Label(self.root, text="饭卡充值", font=("Arial", 16)).pack(pady=10)
        
        # 卡号显示
        tk.Label(self.root, text="卡号:").pack()
        self.recharge_card_id_entry = tk.Entry(self.root, state='readonly')
        self.recharge_card_id_entry.pack()
        
        # 学号显示
        tk.Label(self.root, text="学号:").pack()
        self.recharge_student_id_entry = tk.Entry(self.root, state='readonly')
        self.recharge_student_id_entry.pack()
        
        # 余额显示
        tk.Label(self.root, text="当前余额:").pack()
        self.recharge_balance_entry = tk.Entry(self.root, state='readonly')
        self.recharge_balance_entry.pack()
        
        tk.Button(self.root, text="查询余额", command=self.query_balance_for_recharge).pack(pady=5)
        
        # 充值金额
        tk.Label(self.root, text="充值金额:").pack()
        self.recharge_amount_entry = tk.Entry(self.root)
        self.recharge_amount_entry.pack()
        
        tk.Button(self.root, text="充值", command=self.do_recharge).pack(pady=20)
        
    def query_balance_for_recharge(self):
        """为充值查询余额"""
        card_id = self.read_card()
        if not card_id:
            return
            
        self.recharge_card_id_entry.config(state='normal')
        self.recharge_card_id_entry.delete(0, tk.END)
        self.recharge_card_id_entry.insert(0, card_id)
        self.recharge_card_id_entry.config(state='readonly')
        
        # 读取卡数据
        data = self.read_card_data()
        if not data:
            return
            
        # 解析卡数据
        try:
            # 卡状态(1位)
            is_registered = data[0] == '1'
            # 挂失状态(1位)
            is_lost = data[1] == '1'
            # 金额(4位十六进制)
            hex_balance = data[2:6]
            balance = int(hex_balance, 16)
            # 学号(12位)
            student_id = data[6:18].rstrip('0')
            
            if not is_registered or is_lost:
                messagebox.showerror("错误", "卡未注册或已挂失")
                return
                
            self.recharge_student_id_entry.config(state='normal')
            self.recharge_student_id_entry.delete(0, tk.END)
            self.recharge_student_id_entry.insert(0, student_id)
            self.recharge_student_id_entry.config(state='readonly')
            
            self.recharge_balance_entry.config(state='normal')
            self.recharge_balance_entry.delete(0, tk.END)
            self.recharge_balance_entry.insert(0, f"{balance:.2f}")
            self.recharge_balance_entry.config(state='readonly')
        except Exception as e:
            messagebox.showerror("错误", f"解析卡数据失败: {str(e)}")
        
    def do_recharge(self):
        """执行充值操作"""
        card_id = self.recharge_card_id_entry.get()
        amount = self.recharge_amount_entry.get()
        
        if not card_id:
            messagebox.showerror("错误", "请先查询卡信息")
            return
            
        try:
            amount = float(amount)
            if amount <= 0:
                messagebox.showerror("错误", "充值金额必须大于0")
                return
        except ValueError:
            messagebox.showerror("错误", "请输入有效的金额")
            return
            
        # 读取当前卡数据
        data = self.read_card_data()
        if not data:
            return
            
        try:
            # 解析当前余额
            current_balance = int(data[2:6], 16)
            
            # 检查余额上限(假设上限为1000元)
            if current_balance + amount > 9998:
                messagebox.showerror("错误", "余额充足，充值失败(上限1000元)")
                return
                
            # 构造新数据
            new_balance = current_balance + amount
            hex_balance = f"{int(new_balance):04X}"
            new_data = data[:2] + hex_balance + data[6:]
            
            # 写入卡数据
            if not self.write_card_data(new_data):
                return
                
            # 记录操作
            self.operations.append({
                'card_id': card_id,
                'operation_type': "充值",
                'amount': amount,
                'operation_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            # 更新显示
            self.recharge_balance_entry.config(state='normal')
            self.recharge_balance_entry.delete(0, tk.END)
            self.recharge_balance_entry.insert(0, f"{new_balance:.2f}")
            self.recharge_balance_entry.config(state='readonly')
            
            messagebox.showinfo("成功", f"充值成功，当前余额: {new_balance:.2f}元")
        except Exception as e:
            messagebox.showerror("错误", f"充值失败: {str(e)}")

    def show_consume(self):
        """显示消费界面"""
        self.clear_window()
        
        tk.Button(self.root, text="返回", command=self.show_main).pack(anchor="nw", padx=10, pady=10)
        
        tk.Label(self.root, text="饭卡消费", font=("Arial", 16)).pack(pady=10)
        
        # 卡号显示
        tk.Label(self.root, text="卡号:").pack()
        self.consume_card_id_entry = tk.Entry(self.root, state='readonly')
        self.consume_card_id_entry.pack()
        
        # 学号显示
        tk.Label(self.root, text="学号:").pack()
        self.consume_student_id_entry = tk.Entry(self.root, state='readonly')
        self.consume_student_id_entry.pack()
        
        # 余额显示
        tk.Label(self.root, text="当前余额:").pack()
        self.consume_balance_entry = tk.Entry(self.root, state='readonly')
        self.consume_balance_entry.pack()
        
        tk.Button(self.root, text="查询余额", command=self.query_balance_for_consume).pack(pady=5)
        
        # 消费金额
        tk.Label(self.root, text="消费金额:").pack()
        self.consume_amount_entry = tk.Entry(self.root)
        self.consume_amount_entry.pack()
        
        tk.Button(self.root, text="消费", command=self.do_consume).pack(pady=20)
        
    def query_balance_for_consume(self):
        """为消费查询余额"""
        card_id = self.read_card()
        if not card_id:
            return
            
        self.consume_card_id_entry.config(state='normal')
        self.consume_card_id_entry.delete(0, tk.END)
        self.consume_card_id_entry.insert(0, card_id)
        self.consume_card_id_entry.config(state='readonly')
        
        # 读取卡数据
        data = self.read_card_data()
        if not data:
            return
            
        # 解析卡数据
        try:
            # 卡状态(1位)
            is_registered = data[0] == '1'
            # 挂失状态(1位)
            is_lost = data[1] == '1'
            # 金额(4位十六进制)
            hex_balance = data[2:6]
            balance = int(hex_balance, 16)
            # 学号(12位)
            student_id = data[6:18].rstrip('0')
            
            if not is_registered or is_lost:
                messagebox.showerror("错误", "卡未注册或已挂失")
                return
                
            self.consume_student_id_entry.config(state='normal')
            self.consume_student_id_entry.delete(0, tk.END)
            self.consume_student_id_entry.insert(0, student_id)
            self.consume_student_id_entry.config(state='readonly')
            
            self.consume_balance_entry.config(state='normal')
            self.consume_balance_entry.delete(0, tk.END)
            self.consume_balance_entry.insert(0, f"{balance:.2f}")
            self.consume_balance_entry.config(state='readonly')
        except Exception as e:
            messagebox.showerror("错误", f"解析卡数据失败: {str(e)}")

    def show_consume(self):
        """显示消费界面"""
        self.clear_window()
        
        tk.Button(self.root, text="返回", command=self.show_main).pack(anchor="nw", padx=10, pady=10)
        
        tk.Label(self.root, text="饭卡消费", font=("Arial", 16)).pack(pady=10)
        
        # 卡号显示
        tk.Label(self.root, text="卡号:").pack()
        self.consume_card_id_entry = tk.Entry(self.root, state='readonly')
        self.consume_card_id_entry.pack()
        
        # 学号显示
        tk.Label(self.root, text="学号:").pack()
        self.consume_student_id_entry = tk.Entry(self.root, state='readonly')
        self.consume_student_id_entry.pack()
        
        # 余额显示
        tk.Label(self.root, text="当前余额:").pack()
        self.consume_balance_entry = tk.Entry(self.root, state='readonly')
        self.consume_balance_entry.pack()
        
        tk.Button(self.root, text="查询余额", command=self.query_balance_for_consume).pack(pady=5)
        
        # 消费金额
        tk.Label(self.root, text="消费金额:").pack()
        self.consume_amount_entry = tk.Entry(self.root)
        self.consume_amount_entry.pack()
        
        tk.Button(self.root, text="消费", command=self.do_consume).pack(pady=20)
        
    def query_balance_for_consume(self):
        """为消费查询余额"""
        card_id = self.read_card()
        if not card_id:
            return
            
        self.consume_card_id_entry.config(state='normal')
        self.consume_card_id_entry.delete(0, tk.END)
        self.consume_card_id_entry.insert(0, card_id)
        self.consume_card_id_entry.config(state='readonly')
        
        # 读取卡数据
        data = self.read_card_data()
        if not data:
            return
            
        # 解析卡数据
        try:
            # 卡状态(1位)
            is_registered = data[0] == '1'
            # 挂失状态(1位)
            is_lost = data[1] == '1'
            # 金额(4位十六进制)
            hex_balance = data[2:6]
            balance = int(hex_balance, 16)
            # 学号(12位)
            student_id = data[6:18].rstrip('0')
            
            if not is_registered or is_lost:
                messagebox.showerror("错误", "卡未注册或已挂失")
                return
                
            self.consume_student_id_entry.config(state='normal')
            self.consume_student_id_entry.delete(0, tk.END)
            self.consume_student_id_entry.insert(0, student_id)
            self.consume_student_id_entry.config(state='readonly')
            
            self.consume_balance_entry.config(state='normal')
            self.consume_balance_entry.delete(0, tk.END)
            self.consume_balance_entry.insert(0, f"{balance:.2f}")
            self.consume_balance_entry.config(state='readonly')
        except Exception as e:
            messagebox.showerror("错误", f"解析卡数据失败: {str(e)}")
        
    def do_consume(self):
        """执行消费操作"""
        card_id = self.consume_card_id_entry.get()
        amount = self.consume_amount_entry.get()
        
        if not card_id:
            messagebox.showerror("错误", "请先查询卡信息")
            return
            
        try:
            amount = float(amount)
            if amount <= 0:
                messagebox.showerror("错误", "消费金额必须大于0")
                return
        except ValueError:
            messagebox.showerror("错误", "请输入有效的金额")
            return
            
        # 读取当前卡数据
        data = self.read_card_data()
        if not data:
            return
            
        try:
            # 解析当前余额
            current_balance = int(data[2:6], 16)
            
            # 检查余额是否充足
            if current_balance < amount:
                messagebox.showerror("错误", "余额不足")
                return
                
            # 构造新数据
            new_balance = current_balance - amount
            hex_balance = f"{int(new_balance):04X}"
            new_data = data[:2] + hex_balance + data[6:]
            
            # 写入卡数据
            if not self.write_card_data(new_data):
                return
                
            # 记录操作
            self.operations.append({
                'card_id': card_id,
                'operation_type': "消费",
                'amount': amount,
                'operation_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            # 更新显示
            self.consume_balance_entry.config(state='normal')
            self.consume_balance_entry.delete(0, tk.END)
            self.consume_balance_entry.insert(0, f"{new_balance:.2f}")
            self.consume_balance_entry.config(state='readonly')
            
            messagebox.showinfo("成功", f"消费成功，当前余额: {new_balance:.2f}元")
        except Exception as e:
            messagebox.showerror("错误", f"消费失败: {str(e)}")
        
    def show_lost(self):
        """显示挂失界面"""
        self.clear_window()
        
        tk.Button(self.root, text="返回", command=self.show_main).pack(anchor="nw", padx=10, pady=10)
        
        tk.Label(self.root, text="饭卡挂失", font=("Arial", 16)).pack(pady=10)
        
        # 卡号显示
        tk.Label(self.root, text="卡号:").pack()
        self.lost_card_id_entry = tk.Entry(self.root, state='readonly')
        self.lost_card_id_entry.pack()
        
        # 学号显示
        tk.Label(self.root, text="学号:").pack()
        self.lost_student_id_entry = tk.Entry(self.root, state='readonly')
        self.lost_student_id_entry.pack()
        
        # 余额显示
        tk.Label(self.root, text="当前余额:").pack()
        self.lost_balance_entry = tk.Entry(self.root, state='readonly')
        self.lost_balance_entry.pack()
        
        tk.Button(self.root, text="查询卡信息", command=self.query_info_for_lost).pack(pady=5)
        tk.Button(self.root, text="挂失", command=self.do_lost).pack(pady=20)
        
    def query_info_for_lost(self):
        """为挂失查询卡信息"""
        card_id = self.read_card()
        if not card_id:
            return
            
        self.lost_card_id_entry.config(state='normal')
        self.lost_card_id_entry.delete(0, tk.END)
        self.lost_card_id_entry.insert(0, card_id)
        self.lost_card_id_entry.config(state='readonly')
        
        # 读取卡数据
        data = self.read_card_data()
        if not data:
            return
            
        # 解析卡数据
        try:
            # 卡状态(1位)
            is_registered = data[0] == '1'
            # 挂失状态(1位)
            is_lost = data[1] == '1'
            # 金额(4位十六进制)
            hex_balance = data[2:6]
            balance = int(hex_balance, 16)
            # 学号(12位)
            student_id = data[6:18].rstrip('0')
            
            if not is_registered:
                messagebox.showerror("错误", "卡未注册")
                return
                
            if is_lost:
                messagebox.showerror("错误", "卡已挂失")
                return
                
            self.lost_student_id_entry.config(state='normal')
            self.lost_student_id_entry.delete(0, tk.END)
            self.lost_student_id_entry.insert(0, student_id)
            self.lost_student_id_entry.config(state='readonly')
            
            self.lost_balance_entry.config(state='normal')
            self.lost_balance_entry.delete(0, tk.END)
            self.lost_balance_entry.insert(0, f"{balance:.2f}")
            self.lost_balance_entry.config(state='readonly')
        except Exception as e:
            messagebox.showerror("错误", f"解析卡数据失败: {str(e)}")
            
    def do_lost(self):
        """执行挂失操作"""
        card_id = self.lost_card_id_entry.get()
        
        if not card_id:
            messagebox.showerror("错误", "请先查询卡信息")
            return
            
        # 读取当前卡数据
        data = self.read_card_data()
        if not data:
            return
            
        try:
            # 修改挂失状态为1
            new_data = data[0] + '1' + data[2:]
            
            # 写入卡数据
            if not self.write_card_data(new_data):
                return
                
            # 记录操作
            self.operations.append({
                'card_id': card_id,
                'operation_type': "挂失",
                'amount': 0,
                'operation_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            
            messagebox.showinfo("成功", "挂失成功")
            self.show_main()
        except Exception as e:
            messagebox.showerror("错误", f"挂失失败: {str(e)}")

if __name__ == '__main__':
    root = tk.Tk()
    app = CardSystem(root)
    root.mainloop()
我需要将一个Python Tkinter开发的饭卡充值消费系统迁移到Vue 3网页版。请使用Ant Design 5.0组件库，实现一个完整的前端应用，包含以下功能：

1. 系统功能：
   - 用户登录界面
   - 主界面（包含串口选择、打开串口按钮）
   - 饭卡注册、充值、消费、挂失、注销功能
   - 操作记录查询

2. 串口通信要求：
   - 使用Web Serial API实现浏览器与串口设备的通信
   - 支持以下串口命令：
     * RID\n：读取卡ID
     * RBK\n：读取数据块
     * WBK+数据\n：写入数据块（32位ASCII十六进制字符串）
   - 数据格式解析：
     * 卡状态（1位）：1表示已注册，0表示未注册
     * 挂失状态（1位）：0表示未挂失，1表示挂失
     * 金额（4位）：十六进制表示，最大9999
     * 学号（12位）
     * 剩余部分填充FF至总长度32个字符

3. 技术要求：
   - 使用Vue 3 Composition API
   - 响应式设计，适配不同屏幕尺寸
   - 良好的错误处理和用户提示
   - 本地存储操作记录（localStorage或IndexedDB）
   - 不需要后端支持，纯前端实现

请提供完整的项目代码，包括：
1. 项目结构
2. 所有必要的Vue组件
3. 串口通信模块
4. 数据处理逻辑
5. 界面样式

代码应当清晰、模块化，并附带必要的注释说明。