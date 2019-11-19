import { Container, decorate, injectable, inject as _inject, tagged, named } from 'inversify';
import _ from 'lodash';

const selfSymbol = Symbol('self');
const container = new Container;
export default container;

export const register = module.hot ? hot(binder) : binder;
register.autoFactory = factory('autoFactory');
register.constantValue = factory('constantValue');
register.constructor = factory('constructor');
register.dynamicValue = factory('dynamicValue');
register.provider = factory('provider');
register.function = factory('function');
register.factory = factory('factory');

export function inject(targetOrKey, propertyKey, descriptor) {
    if (arguments.length === 3) {
        return {...descriptor, initializer: () => container.get(propertyKey)};
    }
    return (target, propertyKey, descriptor) =>
        inject(target, targetOrKey, descriptor);
}

inject.lazy = function lazyInject(targetOrKey, propertyKey, descriptor) {
    if (arguments.length === 3) {
        return {
            enumerable: true,
            configurable: true,
            get() {
                const value = container.get(propertyKey);
                Object.defineProperty(this, propertyKey, {value});
                return value;
            }
        };
    }
    return (target, propertyKey) => ({
        enumerable: true,
        configurable: true,
        get() {
            const value = container.get(targetOrKey);
            Object.defineProperty(this, propertyKey, {value});
            return value;
        }
    });
};

inject.props = function injectProps(propsMap) {
    return Component => props => {
        const inject = _.mapValues(propsMap, type => container.get(type));
        return <Component {...inject} {...props} />;
    };
};

function binder(identifier, dependencies, constraint) {
    if (identifier === undefined) {
        identifier = selfSymbol;
    }
    else if (Array.isArray(identifier)) {
        constraint = dependencies;
        dependencies = identifier;
        identifier = selfSymbol;
    }
    else if (typeof identifier === 'function') {
        constraint = identifier;
        identifier = selfSymbol;
    }
    if (typeof dependencies === 'function') {
        constraint = dependencies;
        dependencies = [];
    }
    return constructor => {
        const binding = identifier === selfSymbol
            ? bindingByType('self',[dependencies, constructor])
            : bindingByType(null,[identifier, dependencies, constructor]);
        constraint && constraint(binding);
    }
}

function annotate(constructor, dependencies) {
    if (dependencies === void 0) { dependencies = []; }
    decorate(injectable(), constructor);
    (dependencies).forEach(function (injection, index) {
        if (injection.type === undefined) {
            decorate(_inject(injection), constructor, index);
        }
        else {
            decorate(_inject(injection.type), constructor, index);
            if (injection.named !== undefined) {
                decorate(named(injection.named), constructor, index);
            }
            if (injection.tagged !== undefined) {
                decorate(tagged(injection.tagged.key, injection.tagged.value), constructor, index);
            }
        }
    });
}

function factory(type = null) {
    return module.hot ? hot(register) : register;
    function register(...args) {
        if (type === 'constructor') {
            return constructor => bind(type, [args[0], constructor], args[1]);
        }
        bind(type, args, args.length > 2 ? args.pop() : null);
        function bind(type, args, constraint) {
            const binding = bindingByType(type, args);
            constraint && constraint(binding);
        }
    }
}

function bindingByType(type, args) {
    switch (type) {
        case 'provider': {
            const [ identifier, provider ] = args;
            return container.bind(identifier).toProvider(provider);
        }
        case 'factory': {
            const [ identifier, factory ] = args;
            return container.bind(identifier).toFactory(factory);
        }
        case 'autoFactory': {
            const [ factoryIdentifier, serviceIdentifier ] = args;
            return container.bind(factoryIdentifier).toProvider(serviceIdentifier);
        }
        case 'function': {
            const [ identifier, func ] = args;
            return container.bind(identifier).toFunction(func);
        }
        case 'dynamicValue': {
            const [ identifier, func ] = args;
            return container.bind(identifier).toDynamicValue(func);
        }
        case 'constantValue': {
            const [ identifier, value ] = args;
            return container.bind(identifier).toConstantValue(value);
        }
        case 'constructor': {
            const [ identifier, constructor ] = args;
            return container.bind(identifier).toConstructor(constructor);
        }
        case 'self': {
            const [ dependencies, constructor ] = args;
            annotate(constructor, dependencies);
            return container.bind(constructor).toSelf();
        }
        case null: {
            const [ identifier, dependencies, constructor ] = args;
            annotate(constructor, dependencies);
            return container.bind(identifier).to(constructor);
        }
        default:
            throw TypeError(`unknown type "${type}"`);
    }
}

function hot(register) {
    return function(type) {
        const apply = t => {
            container.isBound(t) && container.unbind(t);
            return register(...arguments);
        };
        return typeof type === 'string' ? apply(type) : Type => apply(Type)(Type);
    };
}
