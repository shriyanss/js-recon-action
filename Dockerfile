FROM ghcr.io/puppeteer/puppeteer:24.43.1

WORKDIR /home/pptruser

USER root
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxkbcommon0 \
    libasound2 libpangocairo-1.0-0 libxfixes3 libxi6 libxinerama1 \
    libxcursor1 libdrm2 && \
    rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
COPY scripts/ /scripts/

RUN chmod +x /entrypoint.sh

USER pptruser
RUN ./node_modules/.bin/puppeteer browsers install chrome && \
    for zip in /home/pptruser/.cache/puppeteer/chrome/*-chrome-linux64.zip; do \
        [ -f "$zip" ] || break; \
        version="${zip%-chrome-linux64.zip}"; version="${version##*/}"; \
        dest="/home/pptruser/.cache/puppeteer/chrome/linux-${version}"; \
        unzip -o "$zip" -d "${dest}/" && chmod +x "${dest}/chrome-linux64/chrome"; \
    done

ENV IS_DOCKER=true
ENV NODE_OPTIONS="--max-http-header-size=99999999"
# Puppeteer cache was built as pptruser; point root at the same location
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

USER root
ENTRYPOINT ["/entrypoint.sh"]
