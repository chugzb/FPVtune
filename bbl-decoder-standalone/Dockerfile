FROM python:3.12-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY src/ ./src/

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["uvicorn", "src.entry:app", "--host", "0.0.0.0", "--port", "8080"]
