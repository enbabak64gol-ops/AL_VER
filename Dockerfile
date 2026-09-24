FROM alpine:3.20
RUN apk add --no-cache busybox-extras
WORKDIR /app
COPY index.html admin.html main.pb.js 1700000000_init.js ./
EXPOSE 3000
CMD ["busybox", "httpd", "-f", "-p", "3000", "-h", "/app"]
