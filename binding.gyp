{
    'targets': [
        {
            'target_name': 'n_addon',
            'sources': ['n-api-addon.cc'],
            'conditions': [
                ['OS=="win"', {
                    'include_dirs': ['C:\\Users\\bai_l\\workspace\\boost_1_69_0'],
                    'configurations': {
                        'Debug': {
                            'defines': ['DEBUG', '_DEBUG'],
                            'msvs_settings': {
                                'VCCLCompilerTool': {
                                    'ExceptionHandling': 1,      # /EHsc
                                    'AdditionalOptions': ['/utf-8']
                                },
                                'VCLinkerTool': {
                                    'AdditionalLibraryDirectories': [''],
                                }
                            },
                        }
                    }
                }],
                ['OS' == 'darwin', {
                    "include_dirs": ["/Volumes/Data/Users/luke/workspace/boost_1_69_0"]
                }]
            ]
        }
    ]
}
