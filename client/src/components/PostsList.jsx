// Add this inside your PostsList component:

useEffect(() => {
  console.log('🔍 PostsList received posts:', posts?.length || 0);
  console.log('🔍 Posts data:', posts);
}, [posts]);