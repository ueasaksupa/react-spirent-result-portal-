FROM python:3.8-alpine

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir -r requirements.txt
RUN mkdir -p /media


expose 5050
CMD [ "python", "./backend.py" ]