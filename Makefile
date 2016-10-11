all:

install:
	install -v -D -m0644 apache2-proxy.conf '$(DESTDIR)/etc/apache2/conf-available/valhalla-proxy.conf'
	install -v -D -m0755 etc/valhalla-server.json '$(DESTDIR)/etc/valhalla-server.json'
	find valhalla-server -type f -exec install -v -D -m0644 '{}' '$(DESTDIR)/var/{}' \;
	find demo* docs -type f -exec install -v -D -m0644 '{}' '$(DESTDIR)/var/www/html/{}' \;
	
	mkdir -p '$(DESTDIR)/etc/apache2/mods-enabled'
	mkdir -p '$(DESTDIR)/etc/apache2/conf-enabled'
	ln -s ../mods-available/proxy.conf '$(DESTDIR)/etc/apache2/mods-enabled/proxy.conf'
	ln -s ../mods-available/proxy_http.load '$(DESTDIR)/etc/apache2/mods-enabled/proxy_http.load'
	ln -s ../mods-available/proxy.load '$(DESTDIR)/etc/apache2/mods-enabled/proxy.load'
	ln -s ../conf-available/valhalla-proxy.conf '$(DESTDIR)/etc/apache2/conf-enabled/valhalla-proxy.conf'

SHA = 61dae0e3fafbce575cd9e4a3ae8ed6f550aa0db0

docs/index.html:
	mkdir -p src-docs
	curl -sL https://github.com/valhalla/valhalla-docs/archive/$(SHA).tar.gz \
		| tar -zxv -C src-docs --strip-components=1 valhalla-docs-$(SHA)
	ln -f src-docs/turn-by-turn-overview.md src-docs/index.md
	mkdir -p docs
	mkdocs build --config-file docs-config.yml --site-dir docs
