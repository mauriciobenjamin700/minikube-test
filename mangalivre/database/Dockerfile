FROM postgres:17.4

COPY ./init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["postgres"]