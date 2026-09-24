FROM python:3.12-alpine

WORKDIR /app

COPY index.html admin.html main.pb.js 1700000000_init.js manifest.webmanifest sw.js ./

EXPOSE 3000

CMD ["python3", "-m", "http.server", "3000", "--bind", "0.0.0.0", "--directory", "/app"]
