'use strict';

hexo.extend.filter.register('before_post_render', function(data) {
  const config = hexo.config.access_control || {};
  
  if (!config.enable) {
    return data;
  }

  const categories = data.categories || [];
  const categoryList = categories.toArray ? categories.toArray().map(c => c.name) : 
                       (categories.data || categories).map(c => c.name || c);

  for (const categoryName of categoryList) {
    const categoryConfig = config.categories && config.categories[categoryName];
    
    if (categoryConfig && categoryConfig.password) {
      data.password = categoryConfig.password;
      data.message = categoryConfig.message || config.default_message || '请输入密码访问此文章';
      break;
    }
  }

  return data;
});

hexo.extend.generator.register('access-control-config', function(locals) {
  const config = hexo.config.access_control || {};
  
  if (!config.enable) {
    return;
  }

  const accessConfig = {
    enable: true,
    categories: config.categories || {},
    protected_categories: {},
    default_public: config.default_public !== false,
    messages: {
      password_required: '此分类需要密码访问',
      password_placeholder: '请输入访问密码',
      password_error: '密码错误，请重试'
    }
  };

  if (config.categories) {
    Object.keys(config.categories).forEach(function(category) {
      const catConfig = config.categories[category];
      if (catConfig.password) {
        accessConfig.protected_categories[category] = {
          password_hash: Buffer.from(catConfig.password).toString('base64'),
          message: catConfig.message
        };
      }
    });
  }

  return {
    path: 'access-control-config.json',
    data: JSON.stringify(accessConfig)
  };
});

hexo.extend.generator.register('access-control-assets', function(locals) {
  return [
    {
      path: 'js/access-control.js',
      data: function() {
        return hexo.render.renderSync({
          path: hexo.source_dir + 'js/access-control.js'
        });
      }
    },
    {
      path: 'css/access-control.css',
      data: function() {
        return hexo.render.renderSync({
          path: hexo.source_dir + 'css/access-control.css'
        });
      }
    }
  ];
});

hexo.extend.helper.register('access_control_head', function() {
  const config = hexo.config.access_control || {};
  
  if (!config.enable) {
    return '';
  }

  return `
<script id="access-control-config" type="application/json">
{
  "enable": true,
  "categories": ${JSON.stringify(config.categories || {})},
  "protected_categories": {},
  "default_public": ${config.default_public !== false}
}
</script>
<link rel="stylesheet" href="/css/access-control.css">
<script src="/js/access-control.js"></script>
`;
});
