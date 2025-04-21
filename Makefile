kabum:
	@echo "Removendo todos os containers (incluindo em execução)..."
	-docker rm -f $$(docker ps -aq) 2>/dev/null || true
	@echo "Removendo todas as imagens..."
	-docker rmi -f $$(docker images -q) 2>/dev/null || true
	@echo "Removendo todos os volumes..."
	-docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	@echo "Limpando cache e registros desnecessários..."
	-docker system prune -af
	@echo "Docker completamente limpo com sucesso!"